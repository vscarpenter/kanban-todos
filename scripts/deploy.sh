#!/bin/bash

# Production Deployment Script for Cascade Kanban
# Deploys to S3 bucket with CloudFront invalidation

set -e  # Exit on any error

# Configuration
S3_BUCKET="s3://todos.vinny.dev"
CLOUDFRONT_DISTRIBUTION_ID="E2UEF9C8JAMJH5"
DOMAIN="https://todos.vinny.dev"

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
    log "Deploying to S3..."
    
    # Sync static assets with long cache
    info "Uploading static assets..."
    aws s3 sync ./out $S3_BUCKET \
        --delete \
        --cache-control "max-age=31536000,public" \
        --exclude "*.html" \
        --exclude "*.json" \
        --exclude "*.txt" \
        --exclude "sw.js" \
        --exclude "manifest.json"
    
    # Sync HTML files with no cache
    info "Uploading HTML files..."
    aws s3 sync ./out $S3_BUCKET \
        --delete \
        --cache-control "max-age=0,no-cache,no-store,must-revalidate" \
        --include "*.html"
    
    # Sync other dynamic files with short cache
    info "Uploading dynamic files..."
    aws s3 sync ./out $S3_BUCKET \
        --delete \
        --cache-control "max-age=300,public" \
        --include "*.json" \
        --include "*.txt"

    # Ensure service worker and manifest are never cached
    if [ -f "out/sw.js" ]; then
        info "Uploading service worker with no-cache..."
        aws s3 cp ./out/sw.js $S3_BUCKET/sw.js \
            --cache-control "max-age=0,no-cache,no-store,must-revalidate" \
            --content-type "application/javascript"
    fi

    if [ -f "out/manifest.json" ]; then
        info "Uploading manifest with short/no-cache..."
        aws s3 cp ./out/manifest.json $S3_BUCKET/manifest.json \
            --cache-control "max-age=0,no-cache,must-revalidate" \
            --content-type "application/manifest+json"
    fi
    
    info "✓ S3 deployment completed"
}

# Invalidate CloudFront cache
invalidate_cloudfront() {
    log "Invalidating CloudFront cache..."
    
    INVALIDATION_ID=$(aws cloudfront create-invalidation \
        --distribution-id $CLOUDFRONT_DISTRIBUTION_ID \
        --paths "/*" \
        --query 'Invalidation.Id' \
        --output text)
    
    info "✓ CloudFront invalidation created: $INVALIDATION_ID"
    
    # Wait for invalidation to complete (optional)
    if [ "$WAIT_FOR_INVALIDATION" = "true" ]; then
        info "Waiting for invalidation to complete..."
        aws cloudfront wait invalidation-completed \
            --distribution-id $CLOUDFRONT_DISTRIBUTION_ID \
            --id $INVALIDATION_ID
        info "✓ Invalidation completed"
    else
        warn "Invalidation is in progress. It may take 5-15 minutes to complete."
    fi
}

# Verify deployment
verify_deployment() {
    log "Verifying deployment..."
    
    # Wait a moment for changes to propagate
    sleep 5
    
    # Check if site is accessible
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $DOMAIN)
    
    if [ "$HTTP_STATUS" = "200" ]; then
        info "✓ Site is accessible at $DOMAIN"
    else
        warn "Site returned HTTP status: $HTTP_STATUS"
        warn "This might be due to CloudFront cache. Try again in a few minutes."
    fi
    
    # Check for specific content
    if curl -s $DOMAIN | grep -q "Cascade"; then
        info "✓ Application content verified"
    else
        warn "Could not verify application content"
    fi
    
    # Test security headers
    info "Testing security headers..."
    if command -v ./scripts/test-security-headers.sh &> /dev/null; then
        ./scripts/test-security-headers.sh
    else
        warn "Security headers test script not found. Run manually: ./scripts/test-security-headers.sh"
    fi
}

# Main deployment process
main() {
    info "Starting deployment to production..."
    info "Target: $DOMAIN"
    info "S3 Bucket: $S3_BUCKET"
    info "CloudFront Distribution: $CLOUDFRONT_DISTRIBUTION_ID"
    echo
    
    check_prerequisites
    build_app
    deploy_to_s3
    invalidate_cloudfront
    verify_deployment
    
    echo
    log "🚀 Deployment completed successfully!"
    info "Your application is now live at: $DOMAIN"
    
    if [ "$WAIT_FOR_INVALIDATION" != "true" ]; then
        warn "Note: CloudFront cache invalidation is in progress."
        warn "Changes may take 5-15 minutes to be visible globally."
    fi
}

# Run main function
main "$@"
