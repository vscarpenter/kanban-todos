import type { NextConfig } from "next";

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

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
  distDir: 'out',
  
  // Security headers are enforced by CloudFront response headers policy.
  // With `output: 'export'`, Next.js `headers()` are not applied.
  
  // Performance optimizations
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons', '@dnd-kit/core'],
    turbopackUseSystemTlsCerts: true, // Fix font fetching in some environments
  },

  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Enable gzip compression
  compress: true,

  // Turbopack configuration (Next.js 16+ uses Turbopack by default)
  // Force workspace root to this repo to avoid parent lockfile inference.
  turbopack: {
    root: process.cwd(),
  },
};

export default withBundleAnalyzer(nextConfig);
