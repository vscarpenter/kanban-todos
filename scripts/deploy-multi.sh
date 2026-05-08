#!/usr/bin/env bash

# Multi-Environment Deployment Script for Cascade Kanban
# Supports deployment to multiple S3 buckets and CloudFront distributions

# -e:        exit on any non-zero command
# -u:        treat unset variables as an error
# -o pipefail: a pipeline returns the first non-zero exit code, not the last
set -euo pipefail

# Default configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
CONFIG_FILE="$PROJECT_DIR/deploy-config.json"

# Optional flag controlled by --wait-invalidation. Default to empty so `set -u`
# doesn't trip when checking it.
WAIT_FOR_INVALIDATION="${WAIT_FOR_INVALIDATION:-}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
log() {
    echo -e "${GREEN}[DEPLOY]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Function to load environment configuration
load_config() {
    local env_name="$1"

    if [ ! -f "$CONFIG_FILE" ]; then
        error "Configuration file not found: $CONFIG_FILE"
    fi

    if ! command -v jq &> /dev/null; then
        error "jq is not installed. Please install jq to parse JSON configuration."
    fi

    # Reject anything outside [a-zA-Z0-9_-] before interpolating into the jq
    # filter. This isn't an exposed-to-the-internet path, but it stops typos
    # like `--cascade` from being treated as a jq operator.
    if ! [[ "$env_name" =~ ^[A-Za-z0-9_-]+$ ]]; then
        error "Invalid environment name: '$env_name' (must match [A-Za-z0-9_-]+)"
    fi

    # Check if environment exists. Use --arg to interpolate safely.
    if ! jq -e --arg env "$env_name" '.environments[$env]' "$CONFIG_FILE" > /dev/null; then
        error "Environment '$env_name' not found in configuration"
    fi

    # Load environment variables
    ENV_NAME="$(jq -r --arg env "$env_name" '.environments[$env].name' "$CONFIG_FILE")"
    S3_BUCKET="$(jq -r --arg env "$env_name" '.environments[$env].s3_bucket' "$CONFIG_FILE")"
    CLOUDFRONT_DISTRIBUTION_ID="$(jq -r --arg env "$env_name" '.environments[$env].cloudfront_distribution_id' "$CONFIG_FILE")"
    DOMAIN="$(jq -r --arg env "$env_name" '.environments[$env].domain' "$CONFIG_FILE")"
    SECURITY_HEADERS_POLICY_ID="$(jq -r --arg env "$env_name" '.environments[$env].security_headers_policy_id' "$CONFIG_FILE")"
    DESCRIPTION="$(jq -r --arg env "$env_name" '.environments[$env].description' "$CONFIG_FILE")"
    export ENV_NAME S3_BUCKET CLOUDFRONT_DISTRIBUTION_ID DOMAIN SECURITY_HEADERS_POLICY_ID DESCRIPTION

    info "Loaded configuration for environment: $ENV_NAME"
    info "Target domain: $DOMAIN"
    info "S3 bucket: $S3_BUCKET"
    info "CloudFront distribution: $CLOUDFRONT_DISTRIBUTION_ID"
}

# Function to show available environments
show_environments() {
    echo "Available environments:"
    jq -r '.environments | keys[]' "$CONFIG_FILE" | while read -r env; do
        local name desc
        name="$(jq -r --arg env "$env" '.environments[$env].name' "$CONFIG_FILE")"
        desc="$(jq -r --arg env "$env" '.environments[$env].description' "$CONFIG_FILE")"
        echo "  $env: $name - $desc"
    done
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if AWS CLI is installed
    if ! command -v aws &> /dev/null; then
        error "AWS CLI is not installed. Please install it first."
    fi
    
    # Check if AWS credentials are configured
    if ! aws sts get-caller-identity &> /dev/null; then
        error "AWS credentials not configured. Please run 'aws configure' or set environment variables."
    fi
    
    # Check if Node.js and npm are available
    if ! command -v npm &> /dev/null; then
        error "npm is not installed. Please install Node.js and npm."
    fi
    
    info "✓ Prerequisites check passed"
}

# Build the application
build_app() {
    log "Building application..."
    
    cd "$PROJECT_DIR"
    
    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        info "Installing dependencies..."
        npm install
    fi
    
    # Run build
    npm run build
    
    # Verify build output exists
    if [ ! -d "out" ]; then
        error "Build failed - 'out' directory not found"
    fi
    
    info "✓ Build completed successfully"
}

# Deploy to S3
deploy_to_s3() {
    log "Deploying to S3 ($S3_BUCKET)..."

    cd "$PROJECT_DIR"

    # Sync static assets with long cache
    info "Uploading static assets..."
    aws s3 sync ./out "$S3_BUCKET" \
        --delete \
        --cache-control "max-age=31536000,public" \
        --exclude "*.html" \
        --exclude "*.json" \
        --exclude "*.txt" \
        --exclude "sw.js" \
        --exclude "manifest.json"

    # Sync HTML files with no cache
    info "Uploading HTML files..."
    aws s3 sync ./out "$S3_BUCKET" \
        --delete \
        --cache-control "max-age=0,no-cache,no-store,must-revalidate" \
        --include "*.html"

    # Sync other dynamic files with short cache
    info "Uploading dynamic files..."
    aws s3 sync ./out "$S3_BUCKET" \
        --delete \
        --cache-control "max-age=300,public" \
        --include "*.json" \
        --include "*.txt"

    # Ensure service worker and manifest are never cached
    if [ -f "out/sw.js" ]; then
        info "Uploading service worker with no-cache..."
        aws s3 cp ./out/sw.js "$S3_BUCKET/sw.js" \
            --cache-control "max-age=0,no-cache,no-store,must-revalidate" \
            --content-type "application/javascript"
    fi

    if [ -f "out/manifest.json" ]; then
        info "Uploading manifest with short/no-cache..."
        aws s3 cp ./out/manifest.json "$S3_BUCKET/manifest.json" \
            --cache-control "max-age=0,no-cache,must-revalidate" \
            --content-type "application/manifest+json"
    fi

    info "✓ S3 deployment completed"
}

# Invalidate CloudFront cache
invalidate_cloudfront() {
    log "Invalidating CloudFront cache ($CLOUDFRONT_DISTRIBUTION_ID)..."

    local invalidation_id
    invalidation_id="$(aws cloudfront create-invalidation \
        --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
        --paths "/*" \
        --query 'Invalidation.Id' \
        --output text)"

    info "✓ CloudFront invalidation created: $invalidation_id"

    # Wait for invalidation to complete (optional)
    if [ "$WAIT_FOR_INVALIDATION" = "true" ]; then
        info "Waiting for invalidation to complete..."
        aws cloudfront wait invalidation-completed \
            --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
            --id "$invalidation_id"
        info "✓ Invalidation completed"
    else
        warn "Invalidation is in progress. It may take 5-15 minutes to complete."
    fi
}

# Test security headers for specific environment
test_security_headers() {
    log "Testing security headers for $DOMAIN..."
    
    # Create temporary test script for this environment
    local temp_script="/tmp/test-security-headers-$ENV_NAME.sh"
    
    cat > "$temp_script" << EOF
#!/bin/bash
URL="$DOMAIN"
echo "Testing security headers for: \$URL"
echo "========================================="

HEADERS=\$(curl -sI "\$URL")
echo "Response Headers:"
echo "\$HEADERS"
echo ""

echo "Security Headers Analysis:"
echo "========================================="

# Check for specific security headers
if echo "\$HEADERS" | grep -qi "content-security-policy"; then
    echo "✅ Content-Security-Policy: Present"
    echo "\$HEADERS" | grep -i "content-security-policy"
else
    echo "❌ Content-Security-Policy: Missing"
fi

if echo "\$HEADERS" | grep -qi "x-frame-options"; then
    echo "✅ X-Frame-Options: Present"
    echo "\$HEADERS" | grep -i "x-frame-options"
else
    echo "❌ X-Frame-Options: Missing"
fi

if echo "\$HEADERS" | grep -qi "x-content-type-options"; then
    echo "✅ X-Content-Type-Options: Present"
    echo "\$HEADERS" | grep -i "x-content-type-options"
else
    echo "❌ X-Content-Type-Options: Missing"
fi

if echo "\$HEADERS" | grep -qi "strict-transport-security"; then
    echo "✅ Strict-Transport-Security: Present"
    echo "\$HEADERS" | grep -i "strict-transport-security"
else
    echo "❌ Strict-Transport-Security: Missing"
fi

if echo "\$HEADERS" | grep -qi "referrer-policy"; then
    echo "✅ Referrer-Policy: Present"
    echo "\$HEADERS" | grep -i "referrer-policy"
else
    echo "❌ Referrer-Policy: Missing"
fi

if echo "\$HEADERS" | grep -qi "permissions-policy"; then
    echo "✅ Permissions-Policy: Present"
    echo "\$HEADERS" | grep -i "permissions-policy"
else
    echo "❌ Permissions-Policy: Missing"
fi
EOF
    
    chmod +x "$temp_script"
    "$temp_script"
    rm "$temp_script"
}

# Verify deployment
verify_deployment() {
    log "Verifying deployment for $ENV_NAME..."

    # Wait a moment for changes to propagate
    sleep 5

    # Check if site is accessible
    local http_status
    http_status="$(curl -s -o /dev/null -w "%{http_code}" "$DOMAIN")"

    if [ "$http_status" = "200" ]; then
        info "✓ Site is accessible at $DOMAIN"
    else
        warn "Site returned HTTP status: $http_status"
        warn "This might be due to CloudFront cache. Try again in a few minutes."
    fi

    # Check for specific content
    if curl -s "$DOMAIN" | grep -q "Cascade"; then
        info "✓ Application content verified"
    else
        warn "Could not verify application content"
    fi

    # Test security headers
    test_security_headers
}

# Deploy to all environments
deploy_all() {
    local environments
    environments="$(jq -r '.environments | keys[]' "$CONFIG_FILE")"

    info "Deploying to all environments..."
    build_app

    while IFS= read -r env; do
        [ -z "$env" ] && continue
        echo
        log "========================================="
        log "Deploying to environment: $env"
        log "========================================="

        load_config "$env"
        deploy_to_s3
        invalidate_cloudfront
        verify_deployment

        log "✓ Deployment to $env ($ENV_NAME) completed"
    done <<< "$environments"
}

# Show usage information
usage() {
    echo "Usage: $0 [ENVIRONMENT|all] [OPTIONS]"
    echo ""
    echo "Environments:"
    show_environments
    echo ""
    echo "Options:"
    echo "  --wait-invalidation    Wait for CloudFront invalidation to complete"
    echo "  --skip-build          Skip the build step (use existing build)"
    echo "  --help                Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 todos                    # Deploy to todos environment"
    echo "  $0 cascade                 # Deploy to cascade environment"
    echo "  $0 all                     # Deploy to all environments"
    echo "  $0 todos --wait-invalidation  # Deploy and wait for invalidation"
}

# Main deployment process
main() {
    local environment=""
    local skip_build=false
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --wait-invalidation)
                export WAIT_FOR_INVALIDATION="true"
                shift
                ;;
            --skip-build)
                skip_build=true
                shift
                ;;
            --help)
                usage
                exit 0
                ;;
            all)
                environment="all"
                shift
                ;;
            *)
                if [ -z "$environment" ]; then
                    environment="$1"
                else
                    warn "Unknown option: $1"
                fi
                shift
                ;;
        esac
    done
    
    # Use default environment if none specified
    if [ -z "$environment" ]; then
        environment=$(jq -r '.default_environment' "$CONFIG_FILE")
        info "No environment specified, using default: $environment"
    fi
    
    check_prerequisites
    
    if [ "$environment" = "all" ]; then
        deploy_all
    else
        load_config "$environment"
        
        info "Starting deployment to $ENV_NAME..."
        info "Description: $DESCRIPTION"
        echo
        
        if [ "$skip_build" = false ]; then
            build_app
        else
            info "Skipping build step"
        fi
        
        deploy_to_s3
        invalidate_cloudfront
        verify_deployment
        
        echo
        log "🚀 Deployment to $ENV_NAME completed successfully!"
        info "Your application is now live at: $DOMAIN"
        
        if [ "$WAIT_FOR_INVALIDATION" != "true" ]; then
            warn "Note: CloudFront cache invalidation is in progress."
            warn "Changes may take 5-15 minutes to be visible globally."
        fi
    fi
}

# Run main function
main "$@"
