#!/bin/bash

# Test security headers implementation for todos.vinny.dev
# This script checks if the CloudFront security headers are properly configured

URL="https://todos.vinny.dev"
echo "Testing security headers for: $URL"
echo "========================================="

# Get headers
HEADERS=$(curl -sI "$URL")

echo "Response Headers:"
echo "$HEADERS"
echo ""

# Check for specific security headers
echo "Security Headers Analysis:"
echo "========================================="

# Content Security Policy
if echo "$HEADERS" | grep -qi "content-security-policy"; then
    echo "✅ Content-Security-Policy: Present"
    echo "$HEADERS" | grep -i "content-security-policy"
else
    echo "❌ Content-Security-Policy: Missing"
fi

# X-Frame-Options
if echo "$HEADERS" | grep -qi "x-frame-options"; then
    echo "✅ X-Frame-Options: Present"
    echo "$HEADERS" | grep -i "x-frame-options"
else
    echo "❌ X-Frame-Options: Missing"
fi

# X-Content-Type-Options
if echo "$HEADERS" | grep -qi "x-content-type-options"; then
    echo "✅ X-Content-Type-Options: Present"
    echo "$HEADERS" | grep -i "x-content-type-options"
else
    echo "❌ X-Content-Type-Options: Missing"
fi

# Strict-Transport-Security
if echo "$HEADERS" | grep -qi "strict-transport-security"; then
    echo "✅ Strict-Transport-Security: Present"
    echo "$HEADERS" | grep -i "strict-transport-security"
else
    echo "❌ Strict-Transport-Security: Missing"
fi

# Referrer-Policy
if echo "$HEADERS" | grep -qi "referrer-policy"; then
    echo "✅ Referrer-Policy: Present"
    echo "$HEADERS" | grep -i "referrer-policy"
else
    echo "❌ Referrer-Policy: Missing"
fi

# Permissions-Policy
if echo "$HEADERS" | grep -qi "permissions-policy"; then
    echo "✅ Permissions-Policy: Present"
    echo "$HEADERS" | grep -i "permissions-policy"
else
    echo "❌ Permissions-Policy: Missing"
fi

echo ""
echo "CloudFront Distribution Status:"
aws cloudfront get-distribution --id E2UEF9C8JAMJH5 --query 'Distribution.Status' --output text

echo ""
echo "Note: If headers are missing, the CloudFront distribution may still be deploying."
echo "Deployment typically takes 10-15 minutes to complete worldwide."