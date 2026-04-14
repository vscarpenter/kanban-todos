# ADR-0003: Next.js with Static Export Deployed to S3/CloudFront

**Status:** Accepted  
**Date:** 2024-01-15

## Context

The app is entirely client-side: no user accounts, no API routes, no server-rendered
personalised content. We need a hosting strategy that matches this architecture —
ideally cheap, globally fast, and operationally simple. Next.js is used for its
excellent React DX, file-based routing, and build tooling. But its default deployment
model assumes a Node.js server or a managed platform like Vercel.

Options considered:
- **Vercel (managed Next.js)** — zero config but adds cost, vendor lock-in, and a third-party in the data path
- **Next.js static export + S3/CloudFront** — produces a fully static build deployable to any CDN
- **Vite + React SPA** — lighter build tool but loses Next.js routing conventions and optimisations
- **GitHub Pages** — free static hosting but limited CDN performance and no custom cache control

## Decision

Configure Next.js with `output: 'export'` to generate a fully static site at build time.
The output is deployed to an S3 bucket served through a CloudFront distribution.

This means:
- No server-side rendering or API routes are used or needed
- All routing is handled client-side (dynamic segments use `generateStaticParams`)
- CloudFront provides edge caching, HTTPS, and custom cache-control headers
- Deployments are atomic: upload new build, invalidate CloudFront cache

## Consequences

### Positive
- **No server to maintain** — S3 + CloudFront has no runtime infrastructure to patch or scale
- **Extremely low cost** — static file hosting on S3 is near-zero for typical personal app traffic
- **Global performance** — CloudFront edge nodes serve assets from locations close to the user
- **Privacy alignment** — the hosting layer handles only static assets; it never touches user data
- **Resilient deployments** — the CDN serves the previous build until invalidation completes; no downtime

### Negative
- **Static export constraints** — no `getServerSideProps`, no API routes, no middleware; any future server feature requires architectural changes
- **Cache invalidation on deploy** — CloudFront invalidations must be triggered explicitly; stale assets can persist if the deployment script omits this step
- **No SSR for SEO** — dynamic content cannot be server-rendered; acceptable here since the app is not public-facing content, but a limitation to note
- **Build-time routing only** — all valid URL paths must be known at build time via `generateStaticParams`, which adds friction for truly dynamic routes
