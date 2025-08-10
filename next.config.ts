import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable static export for S3/CloudFront deployment
  output: 'export',
  
  // Add trailing slash to URLs for better S3 compatibility
  trailingSlash: true,
  
  // Disable image optimization for static export
  images: {
    unoptimized: true
  },
  
  // Optional: Configure asset prefix for CDN
  // assetPrefix: process.env.NODE_ENV === 'production' ? 'https://your-cloudfront-domain.com' : '',
  
  // Ensure proper routing for SPA behavior
  distDir: 'out'
};

export default nextConfig;
