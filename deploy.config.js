/**
 * Deployment Configuration for Cascade Kanban
 * 
 * This file contains deployment settings for different environments.
 * Modify these values based on your specific AWS setup.
 */

const deployConfig = {
  production: {
    s3Bucket: 'cascade.vinny.dev',
    cloudFrontDistributionId: 'E1351EA4HZ20NY',
    domain: 'https://cascade.vinny.dev',
    region: 'us-east-1',
    
    // Cache control settings
    cacheControl: {
      static: 'max-age=31536000,public',        // 1 year for JS/CSS/images
      html: 'max-age=0,no-cache,no-store,must-revalidate',  // No cache for HTML
      dynamic: 'max-age=300,public'             // 5 minutes for JSON/TXT
    },
    
    // Security headers for S3
    securityHeaders: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
    }
  },
  
  staging: {
    s3Bucket: 'staging-cascade.vinny.dev',
    cloudFrontDistributionId: 'YOUR_STAGING_DISTRIBUTION_ID',
    domain: 'https://staging-cascade.vinny.dev',
    region: 'us-east-1',
    
    cacheControl: {
      static: 'max-age=3600,public',
      html: 'max-age=0,no-cache',
      dynamic: 'max-age=60,public'
    }
  }
};

module.exports = deployConfig;