# Technical Stack

> Last Updated: 2025-09-01
> Version: 1.0.0

## Application Framework

- **Framework:** Next.js 15
- **Version:** 15.4.6
- **Router:** App Router
- **Build:** Static export for production
- **Runtime:** React 19

## Database System

- **Primary Database:** IndexedDB (Client-side)
- **Implementation:** Custom TaskDatabase class with async/await API
- **Object Stores:** tasks, boards, settings, archive
- **Features:** Version control, export/import with JSON format
- **Persistence:** 100% client-side operation for privacy

## JavaScript Framework

- **Framework:** React 19
- **Language:** TypeScript (strict mode)
- **State Management:** Zustand stores
- **Performance:** React.memo, dynamic imports, lazy loading

## Import Strategy

- **Bundle Strategy:** Dynamic imports for feature components
- **Lazy Loading:** @dnd-kit, dialog components, non-critical features
- **Tree Shaking:** Enabled for optimal bundle size
- **Bundle Size:** ~388kB optimized

## CSS Framework

- **Framework:** Tailwind CSS v4
- **Configuration:** Custom design system
- **Theme:** Dark/light mode support via next-themes
- **Responsive:** Mobile-first design approach

## UI Component Library

- **Library:** shadcn/ui
- **Base Components:** Accessible, customizable components
- **Design System:** Consistent styling and behavior
- **Accessibility:** WCAG 2.1 AA compliance

## Fonts Provider

- **Provider:** Geist fonts (Next.js optimized)
- **Weights:** Optimized font loading
- **Integration:** Built into Next.js layout system

## Icon Library

- **Library:** Lucide icons
- **Implementation:** Centralized exports via src/lib/icons.ts
- **Performance:** Tree-shakeable imports

## Application Hosting

- **Primary:** AWS S3 + CloudFront
- **Domain:** todos.vinny.dev
- **Secondary:** AWS S3 + CloudFront
- **Domain:** cascade.vinny.dev
- **Security:** CSP, HSTS, security headers policy
- **Cache:** 1-year static assets, no HTML cache, 5-min dynamic

## Database Hosting

- **Hosting:** Client-side only (IndexedDB)
- **Storage:** Browser local storage
- **Backup:** JSON export/import functionality
- **Privacy:** No server-side data storage

## Asset Hosting

- **Static Assets:** AWS CloudFront CDN
- **Images:** Optimized via Next.js Image component
- **Cache Policy:** Long-term caching for static resources

## Deployment Solution

- **Platform:** AWS (S3 + CloudFront)
- **Scripts:** Custom deployment automation
- **Commands:** npm run deploy, npm run deploy:multi
- **Environments:** Multi-environment support
- **CI/CD:** Automated via deployment scripts

## Code Repository

- **Platform:** GitHub
- **Repository:** vscarpenter/kanban-todos
- **Branch Strategy:** main branch for production
- **Version Control:** Git with conventional commits

## Development Tools

- **Testing Framework:** Vitest + Testing Library (jsdom)
- **E2E Testing:** Playwright
- **Linting:** ESLint (Next.js configuration)
- **Type Checking:** TypeScript strict mode
- **Containerization:** Dockerfile for development
- **Bundle Analysis:** Built-in analyzer (ANALYZE=true)

## Performance Optimizations

- **Memory Management:** Custom utilities in src/lib/utils/memoryOptimization.ts
- **Component Optimization:** React.memo, useCallback hooks
- **Code Splitting:** Dynamic imports for feature components
- **Lazy Loading:** Non-critical UI components
- **Bundle Size:** ~388kB with tree shaking

## Security Features

- **Content Security Policy:** Strict CSP headers
- **HTTPS:** Enforced via HSTS
- **Privacy:** 100% client-side operation
- **Data Protection:** No server-side data collection