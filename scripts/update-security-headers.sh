#!/bin/bash

set -euo pipefail

# Updates the CloudFront response headers policy with the correct CSP
# derived from docs/security-headers-baseline.json.
#
# Usage:
#   ./scripts/update-security-headers.sh [--dry-run]
#
# Prerequisites: aws cli, jq

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="${SCRIPT_DIR}/../deploy-config.json"
BASELINE_FILE="${SCRIPT_DIR}/../docs/security-headers-baseline.json"
DRY_RUN=false

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    *) echo "Unknown option: $arg"; exit 1 ;;
  esac
done

for cmd in aws jq; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "ERROR: $cmd is required." >&2
    exit 1
  fi
done

for f in "$CONFIG_FILE" "$BASELINE_FILE"; do
  if [[ ! -f "$f" ]]; then
    echo "ERROR: File not found: $f" >&2
    exit 1
  fi
done

# Build the CSP string from the baseline
build_csp() {
  local csp=""
  while IFS= read -r directive; do
    local name="${directive%% *}"
    if [[ -n "$csp" ]]; then
      # Check if this directive name already exists in csp
      if echo "$csp" | grep -qw "$name"; then
        continue
      fi
    fi
    csp="${csp:+$csp; }$directive"
  done < <(jq -r '.csp.requiredDirectives[]' "$BASELINE_FILE")
  # Add upgrade-insecure-requests as a hardening measure
  csp="$csp; upgrade-insecure-requests"
  echo "$csp"
}

CSP_STRING="$(build_csp)"
echo "Generated CSP: $CSP_STRING"

# Get the unique policy IDs from deploy-config.json
POLICY_IDS="$(jq -r '[.environments[].security_headers_policy_id] | unique[]' "$CONFIG_FILE")"

for POLICY_ID in $POLICY_IDS; do
  echo ""
  echo "Updating response headers policy: $POLICY_ID"

  # Fetch current policy
  CURRENT="$(aws cloudfront get-response-headers-policy --id "$POLICY_ID" 2>&1)" || {
    echo "ERROR: Failed to fetch policy $POLICY_ID" >&2
    echo "$CURRENT" >&2
    exit 1
  }

  ETAG="$(echo "$CURRENT" | jq -r '.ETag')"
  POLICY_CONFIG="$(echo "$CURRENT" | jq '.ResponseHeadersPolicy.ResponseHeadersPolicyConfig')"

  # Build the required headers from baseline
  REQUIRED_HEADERS="$(jq -r '.requiredHeaders' "$BASELINE_FILE")"

  # Update the policy config with correct CSP and security headers
  UPDATED_CONFIG="$(echo "$POLICY_CONFIG" | jq \
    --arg csp "$CSP_STRING" \
    --argjson reqHeaders "$REQUIRED_HEADERS" \
    '
    # Set CSP override
    .SecurityHeadersConfig.ContentSecurityPolicy = {
      "Override": true,
      "ContentSecurityPolicy": $csp
    }
    # Set X-Frame-Options
    | .SecurityHeadersConfig.FrameOptions = {
      "Override": true,
      "FrameOption": $reqHeaders["x-frame-options"]
    }
    # Set X-Content-Type-Options
    | .SecurityHeadersConfig.ContentTypeOptions = {
      "Override": true
    }
    # Set Referrer-Policy
    | .SecurityHeadersConfig.ReferrerPolicy = {
      "Override": true,
      "ReferrerPolicy": $reqHeaders["referrer-policy"]
    }
    # Set Strict-Transport-Security
    | .SecurityHeadersConfig.StrictTransportSecurity = {
      "Override": true,
      "AccessControlMaxAgeSec": 31536000,
      "IncludeSubdomains": true,
      "Preload": false
    }
    '
  )"

  if [[ "$DRY_RUN" == "true" ]]; then
    echo "DRY RUN - Would update policy with:"
    echo "$UPDATED_CONFIG" | jq .
    continue
  fi

  aws cloudfront update-response-headers-policy \
    --id "$POLICY_ID" \
    --if-match "$ETAG" \
    --response-headers-policy-config "$UPDATED_CONFIG"

  echo "Policy $POLICY_ID updated successfully."
  echo "Note: CloudFront may take a few minutes to propagate the changes."
done

echo ""
echo "Done. Run './scripts/test-security-headers.sh' after propagation to verify."
