# Production Deployment Guide

This document outlines how to deploy the Cascade Kanban application to production using AWS S3 and CloudFront.

## Prerequisites

### AWS Setup
- **S3 Bucket**: `cascade.vinny.dev` (configured for static website hosting)
- **CloudFront Distribution**: `E1351EA4HZ20NY` (pointing to the S3 bucket)
- **Domain**: `cascade.vinny.dev` (pointing to CloudFront)

### Local Requirements
- Node.js 18+
- AWS CLI installed and configured
- Appropriate AWS permissions for S3 and CloudFront

## Deployment Methods

### Method 1: Quick Deployment (npm scripts)
```bash
# Full deployment (build + upload + invalidate)
npm run deploy

# Individual steps
npm run build                 # Build the application
npm run deploy:s3            # Upload to S3
npm run deploy:invalidate    # Invalidate CloudFront
npm run deploy:check         # Verify deployment
```

### Method 2: Comprehensive Script
```bash
# Run the full deployment script with verification
./scripts/deploy.sh

# With environment variables
WAIT_FOR_INVALIDATION=true ./scripts/deploy.sh
```

### Method 3: GitHub Actions (Automated)
Push to `main` branch or manually trigger the workflow:

1. **Automatic**: Push commits to `main` branch
2. **Manual**: Go to Actions tab → "Deploy to Production" → "Run workflow"

## Deployment Process

### 1. Build Optimization
- Clean build directories (`.next`, `out`)
- Generate optimized static export
- Bundle analysis available via `npm run build:analyze`

### 2. S3 Upload Strategy
```bash
# Static assets (JS, CSS, images) - 1 year cache
Cache-Control: max-age=31536000,public

# HTML files - No cache (for dynamic routing)
Cache-Control: max-age=0,no-cache,no-store,must-revalidate

# Dynamic files (JSON, TXT) - 5 minutes cache
Cache-Control: max-age=300,public
```

### 3. CloudFront Invalidation
- Invalidates all paths (`/*`)
- Takes 5-15 minutes to propagate globally
- Optional: Wait for completion with `WAIT_FOR_INVALIDATION=true`

### 4. Verification
- HTTP status check
- Content verification
- Lighthouse performance audit (in CI)

## AWS Permissions Required

### IAM Policy for Deployment
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket",
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": [
        "arn:aws:s3:::cascade.vinny.dev",
        "arn:aws:s3:::cascade.vinny.dev/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateInvalidation",
        "cloudfront:GetInvalidation"
      ],
      "Resource": "*"
    }
  ]
}
```

## Environment Variables

### Local Development
```bash
# AWS CLI Profile (optional)
export AWS_PROFILE=your-profile

# Region
export AWS_DEFAULT_REGION=us-east-1
```

### GitHub Actions
Set these secrets in your repository:

**Option 1: OIDC (Recommended)**
- `AWS_ROLE_ARN`: ARN of the IAM role for GitHub Actions

**Option 2: Access Keys (Fallback)**
- `AWS_ACCESS_KEY_ID`: Your AWS access key
- `AWS_SECRET_ACCESS_KEY`: Your AWS secret key

## Configuration Files

### deploy.config.js
Contains environment-specific settings:
- S3 bucket names
- CloudFront distribution IDs
- Cache control policies
- Security headers

### package.json scripts
- Deployment commands with optimized parameters
- Cache control settings
- Error handling

## Troubleshooting

### Common Issues

1. **AWS CLI not configured**
   ```bash
   aws configure
   # or
   export AWS_ACCESS_KEY_ID=...
   export AWS_SECRET_ACCESS_KEY=...
   ```

2. **Permission denied**
   - Verify IAM permissions
   - Check S3 bucket policy
   - Ensure CloudFront access

3. **Build fails**
   ```bash
   # Clean install
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

4. **Changes not visible**
   - Wait for CloudFront cache invalidation (5-15 minutes)
   - Check browser cache (hard refresh)
   - Verify invalidation status in AWS Console

### Verification Commands
```bash
# Check site accessibility
curl -I https://cascade.vinny.dev

# Check CloudFront invalidation status
aws cloudfront get-invalidation \
  --distribution-id E1351EA4HZ20NY \
  --id INVALIDATION_ID

# List S3 bucket contents
aws s3 ls s3://cascade.vinny.dev --recursive
```

## Performance Monitoring

### Lighthouse CI
- Runs automatically after deployment
- Monitors Core Web Vitals
- Reports available in GitHub Actions artifacts

### Manual Performance Check
```bash
# Use Lighthouse CLI
npx lighthouse https://cascade.vinny.dev --output=html

# Check bundle size
npm run build:analyze
```

## Security Considerations

- HTTPS enforced via CloudFront
- Security headers configured
- No sensitive data in client bundle
- All data stored locally (IndexedDB)

## Rollback Strategy

### Quick Rollback
1. Deploy previous working commit:
   ```bash
   git checkout PREVIOUS_COMMIT
   npm run deploy
   ```

2. Or use GitHub Actions to deploy specific commit

### S3 Versioning
- Enable S3 versioning for backup
- Keep previous builds for quick restoration

## Monitoring & Alerts

Consider setting up:
- CloudWatch alarms for 4xx/5xx errors
- Performance monitoring
- Uptime monitoring
- Cost alerts

---

For questions or issues with deployment, check the troubleshooting section or contact the development team.