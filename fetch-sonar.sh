#!/usr/bin/env bash
#
# fetch-sonar.sh
# Pulls SonarCloud data into local JSON files for offline analysis by Claude Code.
#
# Usage:
#   ./fetch-sonar.sh <project-key> [output-dir]
#
# Examples:
#   ./fetch-sonar.sh vscarpenter_gsd-task-manager
#   ./fetch-sonar.sh vscarpenter_gsd-task-manager ./reports/sonar
#   SONAR_TOKEN=xxx ./fetch-sonar.sh my_private_project
#
# Environment:
#   SONAR_TOKEN    Required. Generate at https://sonarcloud.io/account/security
#   SONAR_HOST     Optional. Defaults to https://sonarcloud.io
#   SONAR_BRANCH   Optional. Defaults to the project's main branch.
#
# Requires: curl, jq

set -euo pipefail

PROJECT_KEY="${1:-}"
OUTPUT_DIR="${2:-./sonar-data}"
SONAR_HOST="${SONAR_HOST:-https://sonarcloud.io}"
PAGE_SIZE=500
MAX_RESULTS=10000  # SonarCloud hard cap

if [[ -z "$PROJECT_KEY" ]]; then
  echo "Error: project key required" >&2
  echo "Usage: $0 <project-key> [output-dir]" >&2
  exit 1
fi

for cmd in curl jq; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Error: $cmd is required but not installed" >&2
    exit 1
  fi
done

mkdir -p "$OUTPUT_DIR"

AUTH=()
if [[ -n "${SONAR_TOKEN:-}" ]]; then
  AUTH=(-u "${SONAR_TOKEN}:")
fi

BRANCH_PARAM=""
if [[ -n "${SONAR_BRANCH:-}" ]]; then
  BRANCH_PARAM="&branch=${SONAR_BRANCH}"
fi

api_get() {
  local path="$1"
  curl -fsSL "${AUTH[@]}" "${SONAR_HOST}${path}"
}

fetch_paginated() {
  # Fetches a paginated endpoint. Writes each page to a temp file then merges,
  # which avoids ARG_MAX limits on large result sets.
  # Args: <base-url> <items-jq-path> <total-jq-path>
  local base_url="$1"
  local items_path="$2"
  local total_path="$3"

  local tmpdir
  tmpdir=$(mktemp -d)

  local page=1
  local total=0
  local fetched=0

  while :; do
    local sep="?"
    [[ "$base_url" == *"?"* ]] && sep="&"
    local url="${base_url}${sep}ps=${PAGE_SIZE}&p=${page}"

    local resp
    resp=$(api_get "$url")

    # Write batch to its own file
    echo "$resp" | jq "${items_path} // []" > "${tmpdir}/page-${page}.json"

    total=$(echo "$resp" | jq "${total_path} // 0")
    local batch_size
    batch_size=$(jq 'length' "${tmpdir}/page-${page}.json")
    fetched=$((fetched + batch_size))

    if (( batch_size == 0 )) || (( fetched >= total )); then
      break
    fi

    if (( page * PAGE_SIZE >= MAX_RESULTS )); then
      echo "  warning: hit ${MAX_RESULTS} result cap, results truncated" >&2
      break
    fi

    page=$((page + 1))
  done

  # Merge all pages from disk, no argv pressure
  jq -s 'add // []' "${tmpdir}"/page-*.json
  rm -rf "$tmpdir"
}

echo "Fetching Sonar data for ${PROJECT_KEY}..."

# Measures
echo "  measures..."
METRICS="coverage,line_coverage,branch_coverage,duplicated_lines_density,complexity,cognitive_complexity,sqale_index,sqale_rating,reliability_rating,security_rating,vulnerabilities,bugs,code_smells,security_hotspots,ncloc,tests,test_success_density,test_failures,test_errors"
api_get "/api/measures/component?component=${PROJECT_KEY}&metricKeys=${METRICS}${BRANCH_PARAM}" \
  > "${OUTPUT_DIR}/measures.json"

# Quality gate
echo "  quality gate..."
api_get "/api/qualitygates/project_status?projectKey=${PROJECT_KEY}${BRANCH_PARAM}" \
  > "${OUTPUT_DIR}/quality-gate.json"

# Issues
echo "  issues..."
fetch_paginated \
  "/api/issues/search?componentKeys=${PROJECT_KEY}${BRANCH_PARAM}" \
  ".issues" \
  ".total" \
  | jq '{total: length, issues: .}' \
  > "${OUTPUT_DIR}/issues.json"

# Hotspots
echo "  hotspots..."
fetch_paginated \
  "/api/hotspots/search?projectKey=${PROJECT_KEY}${BRANCH_PARAM}" \
  ".hotspots" \
  ".paging.total" \
  | jq '{total: length, hotspots: .}' \
  > "${OUTPUT_DIR}/hotspots.json"

# Manifest for reproducibility
cat > "${OUTPUT_DIR}/manifest.json" <<EOF
{
  "project_key": "${PROJECT_KEY}",
  "sonar_host": "${SONAR_HOST}",
  "branch": "${SONAR_BRANCH:-default}",
  "fetched_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "files": {
    "measures": "measures.json",
    "quality_gate": "quality-gate.json",
    "issues": "issues.json",
    "hotspots": "hotspots.json"
  }
}
EOF

# Summary, with safe fallbacks for missing metrics
ISSUE_COUNT=$(jq '.total' "${OUTPUT_DIR}/issues.json")
HOTSPOT_COUNT=$(jq '.total' "${OUTPUT_DIR}/hotspots.json")
QG_STATUS=$(jq -r '.projectStatus.status // "UNKNOWN"' "${OUTPUT_DIR}/quality-gate.json")
COVERAGE=$(jq -r '[.component.measures[]? | select(.metric=="coverage") | .value][0] // "n/a"' "${OUTPUT_DIR}/measures.json")
BUGS=$(jq -r '[.component.measures[]? | select(.metric=="bugs") | .value][0] // "n/a"' "${OUTPUT_DIR}/measures.json")
VULNS=$(jq -r '[.component.measures[]? | select(.metric=="vulnerabilities") | .value][0] // "n/a"' "${OUTPUT_DIR}/measures.json")
SMELLS=$(jq -r '[.component.measures[]? | select(.metric=="code_smells") | .value][0] // "n/a"' "${OUTPUT_DIR}/measures.json")

echo ""
echo "Summary:"
echo "  Quality gate:    ${QG_STATUS}"
echo "  Coverage:        ${COVERAGE}%"
echo "  Bugs:            ${BUGS}"
echo "  Vulnerabilities: ${VULNS}"
echo "  Code smells:     ${SMELLS}"
echo "  Issues:          ${ISSUE_COUNT}"
echo "  Hotspots:        ${HOTSPOT_COUNT}"
echo "  Output:          ${OUTPUT_DIR}/"
