#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASELINE_FILE="${BASELINE_FILE:-$SCRIPT_DIR/../docs/security-headers-baseline.json}"

if ! command -v jq >/dev/null 2>&1; then
  echo "ERROR: jq is required to validate security headers."
  exit 1
fi

if [[ ! -f "$BASELINE_FILE" ]]; then
  echo "ERROR: Baseline file not found: $BASELINE_FILE"
  exit 1
fi

get_header() {
  local headers="$1"
  local header_name="$2"
  local target
  target="$(printf '%s' "$header_name" | tr '[:upper:]' '[:lower:]')"

  printf '%s\n' "$headers" | awk -F': *' -v target="$target" '
    {
      key = tolower($1)
      if (key == target) {
        value = substr($0, index($0, $2))
        sub(/\r$/, "", value)
        print value
        exit
      }
    }
  '
}

failures=0
domain_count="$(jq '.domains | length' "$BASELINE_FILE")"

if [[ "$domain_count" -eq 0 ]]; then
  echo "ERROR: No domains configured in baseline."
  exit 1
fi

while IFS= read -r domain; do
  echo "Checking headers for: $domain"
  headers="$(curl -fsSI "$domain" || true)"

  if [[ -z "$headers" ]]; then
    echo "  FAIL: Could not retrieve headers."
    failures=$((failures + 1))
    continue
  fi

  while IFS= read -r header_name; do
    expected_value="$(jq -r --arg key "$header_name" '.requiredHeaders[$key]' "$BASELINE_FILE")"
    actual_value="$(get_header "$headers" "$header_name")"

    if [[ -z "$actual_value" ]]; then
      echo "  FAIL: Missing header: $header_name"
      failures=$((failures + 1))
      continue
    fi

    if [[ "$actual_value" != "$expected_value" ]]; then
      echo "  FAIL: Header mismatch for $header_name"
      echo "    expected: $expected_value"
      echo "    actual:   $actual_value"
      failures=$((failures + 1))
    else
      echo "  PASS: $header_name"
    fi
  done < <(jq -r '.requiredHeaders | keys[]' "$BASELINE_FILE")

  csp_value="$(get_header "$headers" "content-security-policy")"
  if [[ -z "$csp_value" ]]; then
    echo "  FAIL: Missing header: content-security-policy"
    failures=$((failures + 1))
    continue
  fi

  while IFS= read -r directive; do
    if ! grep -Fq "$directive" <<<"$csp_value"; then
      echo "  FAIL: CSP missing required directive/token: $directive"
      failures=$((failures + 1))
    else
      echo "  PASS: CSP contains '$directive'"
    fi
  done < <(jq -r '.csp.requiredDirectives[]' "$BASELINE_FILE")

  while IFS= read -r token; do
    if grep -Fq "$token" <<<"$csp_value"; then
      echo "  FAIL: CSP contains disallowed token: $token"
      failures=$((failures + 1))
    else
      echo "  PASS: CSP excludes '$token'"
    fi
  done < <(jq -r '.csp.disallowedTokens[]' "$BASELINE_FILE")
done < <(jq -r '.domains[]' "$BASELINE_FILE")

if [[ "$failures" -gt 0 ]]; then
  echo "Security header validation failed with $failures issue(s)."
  exit 1
fi

echo "Security header validation passed."
