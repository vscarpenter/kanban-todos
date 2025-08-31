#!/bin/bash

# CloudFront invalidation helper using deploy-config.json
# Usage:
#   ./scripts/invalidate.sh <environment|all> [--paths "/*"] [--wait]
# Examples:
#   ./scripts/invalidate.sh cascade
#   ./scripts/invalidate.sh todos --paths "/sw.js /index.html" --wait

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
CONFIG_FILE="$PROJECT_DIR/deploy-config.json"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[INVALIDATE]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
err()  { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

if ! command -v aws >/dev/null 2>&1; then
  err "AWS CLI not found. Install and configure credentials first."
fi

if ! command -v jq >/dev/null 2>&1; then
  err "jq not found. Install jq to parse JSON config."
fi

ENV_ARG="${1:-}"
shift || true

if [ -z "$ENV_ARG" ]; then
  ENV_ARG=$(jq -r '.default_environment' "$CONFIG_FILE")
  warn "No environment supplied; using default: $ENV_ARG"
fi

PATHS="/*"
WAIT=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --paths)
      PATHS="$2"; shift 2;;
    --wait)
      WAIT=true; shift;;
    *)
      warn "Unknown option: $1"; shift;;
  esac
done

invalidate_one() {
  local env_key="$1"
  local dist_id domain

  dist_id=$(jq -r ".environments.$env_key.cloudfront_distribution_id" "$CONFIG_FILE")
  domain=$(jq -r ".environments.$env_key.domain" "$CONFIG_FILE")

  if [ "$dist_id" = "null" ] || [ -z "$dist_id" ]; then
    err "No CloudFront distribution id for environment: $env_key"
  fi

  log "Creating invalidation for $env_key ($domain) on $dist_id with paths: $PATHS"
  INVALIDATION_ID=$(aws cloudfront create-invalidation \
    --distribution-id "$dist_id" \
    --paths $PATHS \
    --query 'Invalidation.Id' \
    --output text)

  log "Created invalidation: $INVALIDATION_ID"

  if [ "$WAIT" = true ]; then
    log "Waiting for invalidation to complete..."
    aws cloudfront wait invalidation-completed --distribution-id "$dist_id" --id "$INVALIDATION_ID"
    log "Invalidation completed."
  else
    warn "Invalidation in progress; propagation typically takes 5-15 minutes."
  fi
}

if [ "$ENV_ARG" = "all" ]; then
  for env in $(jq -r '.environments | keys[]' "$CONFIG_FILE"); do
    invalidate_one "$env"
  done
else
  invalidate_one "$ENV_ARG"
fi

