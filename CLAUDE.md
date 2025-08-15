# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm run dev` - Start development server on http://localhost:3000
- `npm run build` - Clean (.next, out) and build for production with static export 
- `npm run build:analyze` - Build with bundle analyzer enabled (ANALYZE=true)
- `npm run start` - Start production server
- `npm run lint` - Run ESLint with Next.js configuration

### Deployment
- `npm run deploy` - Single environment deployment (todos.vinny.dev) via `./scripts/deploy.sh`
- `npm run deploy:multi` - Interactive multi-environment deployment script
- `npm run deploy:todos` - Deploy specifically to todos.vinny.dev environment
- `npm run deploy:cascade` - Deploy specifically to cascade.vinny.dev environment  
- `npm run deploy:all` - Deploy to all configured environments
- `npm run deploy:check` - Verify todos.vinny.dev deployment status
- `npm run deploy:check:cascade` - Verify cascade.vinny.dev deployment status
- `./scripts/deploy-multi.sh` - Multi-environment deployment with JSON configuration

### Package Management
- `npm install` - Install all dependencies
- Uses Node.js 18+ with package-lock.json

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 15.4.6 with App Router and static export configuration
- **Language**: TypeScript with strict configuration
- **UI Library**: shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS v4 with custom design system
- **State Management**: Zustand stores with persistence
- **Database**: IndexedDB for client-side storage via custom TaskDatabase class
- **Drag & Drop**: @dnd-kit for accessible kanban interactions (lazy loaded)
- **Icons**: Lucide React (centralized exports for tree-shaking)
- **Notifications**: Sonner for toast messages
- **Performance**: Bundle analyzer, dynamic imports, React.memo optimizations
- **Fonts**: Geist and Geist Mono (optimized weights)

### Project Structure
```
src/
├── app/                 # Next.js App Router
│   ├── layout.tsx      # Root layout with Geist fonts (optimized weights)
│   └── page.tsx        # Main application entry point
├── components/         # React components
│   ├── ui/            # shadcn/ui base components
│   ├── kanban/        # Kanban-specific components (memoized)
│   │   ├── KanbanColumn.tsx # Memoized column component
│   │   └── TaskCard.tsx     # Memoized task card with useCallback
│   ├── DragDropProvider.tsx # Lazy-loaded drag-and-drop wrapper
│   ├── KanbanBoard.tsx # Main board orchestrator
│   ├── Sidebar.tsx    # Navigation with lazy-loaded dialogs
│   └── *Dialog.tsx    # Feature dialogs (dynamically imported)
└── lib/
    ├── stores/        # Zustand state management
    ├── types/         # TypeScript type definitions
    ├── utils/         # Utility functions and database layer
    │   ├── database.ts         # IndexedDB wrapper
    │   ├── memoryOptimization.ts # Performance utilities
    │   └── resetApp.ts         # App reset functionality
    ├── utils.ts       # Common utilities (cn function)
    └── icons.ts       # Centralized icon exports
```

### State Management Architecture
Three main Zustand stores using IndexedDB for persistence (no Zustand persistence middleware to avoid conflicts):

1. **useBoardStore** (`src/lib/stores/boardStore.ts`)
   - Manages board CRUD operations
   - Handles board selection and navigation
   - Supports import/export functionality
   - Default board protection

2. **useTaskStore** (`src/lib/stores/taskStore.ts`) 
   - Task lifecycle management (create, update, delete, archive)
   - Status transitions with progress tracking
   - Filtering and search capabilities
   - Batch operations for import/export
   - Uses IndexedDB directly via taskDB, no Zustand persistence to prevent state conflicts

3. **useSettingsStore** (`src/lib/stores/settingsStore.ts`)
   - Theme management (light/dark/system)
   - Auto-archive configuration
   - Accessibility preferences
   - Debug mode toggle

### Database Layer
Custom IndexedDB wrapper in `src/lib/utils/database.ts`:
- **TaskDatabase class** with async/await API
- Object stores: tasks, boards, settings, archive
- Indexing on boardId, status, archivedAt for efficient queries
- Data validation and error handling
- Export/import with version control

### Component Architecture
- **shadcn/ui configuration**: New York style with neutral base color
- **Drag & Drop**: @dnd-kit with keyboard accessibility (lazy loaded in DragDropProvider)
- **Theme System**: next-themes with CSS custom properties
- **Typography**: Geist for body text, Geist Mono for code (optimized font weights)
- **Responsive Design**: Mobile-first with sidebar toggle
- **Client-Side Rendering**: ClientOnly wrapper for hydration safety
- **Performance Optimizations**:
  - React.memo for TaskCard and KanbanColumn components
  - useCallback for event handlers to prevent unnecessary re-renders
  - Dynamic imports for dialog components (CreateBoard, Settings, etc.)
  - Lazy loading for drag-and-drop functionality
  - Sequential store initialization for faster app startup

### Data Flow
1. App initialization loads stores sequentially (settings → boards → tasks) for optimal performance
2. Board selection triggers task filtering by boardId
3. Task operations update both Zustand state and IndexedDB
4. Real-time UI updates via Zustand subscriptions with memoized components
5. Export/import preserves complete application state
6. Lazy-loaded components render on demand to reduce initial bundle size

### Key Features
- **Multi-Board System**: Unlimited boards with color coding
- **Task Management**: Full CRUD with drag-and-drop between columns
- **Archive System**: Manual and automatic task archiving
- **Privacy-First**: 100% client-side with no external data transmission
- **Accessibility**: WCAG 2.1 AA compliance with keyboard navigation
- **Import/Export**: JSON-based data portability

### Development Notes
- Static export configuration for deployment to S3/CloudFront
- TypeScript strict mode with path aliases (@/* -> src/*)
- ESLint extends Next.js and TypeScript configurations
- All database operations are async and handle browser compatibility
- Zustand stores use IndexedDB directly (no persistence middleware to avoid conflicts)
- Theme switching preserves user preference across sessions

### Production Deployment

#### Dual Environment Setup
- **Primary**: `todos.vinny.dev` (S3: `s3://todos.vinny.dev`, CloudFront: `E2UEF9C8JAMJH5`)
- **Secondary**: `cascade.vinny.dev` (S3: `s3://cascade.vinny.dev`, CloudFront: `E1351EA4HZ20NY`)
- **Configuration**: `deploy-config.json` contains environment-specific settings
- **Cache Strategy**: 1-year cache for static assets, no cache for HTML, 5-min cache for dynamic files
- **Deployment**: Multi-environment support via `./scripts/deploy-multi.sh`

#### Security Configuration (Both Environments)
- **CloudFront Response Headers Policy ID**: `784dc706-262d-418a-9003-238d40a70c6a`
- **Content Security Policy**: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; manifest-src 'self'; worker-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'`
- **Security Headers**: HSTS (1 year), X-Frame-Options (DENY), X-Content-Type-Options (nosniff), Referrer-Policy (strict-origin-when-cross-origin)
- **Permissions-Policy**: Restricts camera, microphone, geolocation, payment, USB, sensors
- **Testing**: Security headers validation included in deployment verification

### Performance Optimizations
- **Bundle Size**: ~388kB First Load JS with optimized vendor chunks
- **Font Loading**: Reduced from 5 weights to 2 (60-80KB savings)
- **Dynamic Imports**: Dialog components lazy loaded (15-25KB savings)
- **Drag & Drop**: Lazy loaded @dnd-kit functionality (35-45KB savings)
- **Tree Shaking**: Centralized icon exports via `src/lib/icons.ts`
- **React Optimizations**: 
  - React.memo for TaskCard and KanbanColumn
  - useCallback for event handlers
  - Sequential Zustand store initialization
- **Bundle Analysis**: Available via `npm run build:analyze`
- **Webpack Configuration**: 
  - Advanced chunk splitting for vendors (dnd-kit, radix-ui, lucide)
  - Tree shaking optimizations enabled
  - Console removal in production builds

### Memory Management
- **Utilities**: `src/lib/utils/memoryOptimization.ts` provides:
  - Debounce and throttle functions
  - Cleanup manager for timers and event listeners  
  - WeakMap-based caching system
  - Optimized array update functions
  - Virtual scrolling helpers for large lists
- **Component Lifecycle**: Proper cleanup of subscriptions and timers
- **Memory Monitoring**: Browser memory usage tracking utilities
- I have the AWS CLI configured locally and todos.vinny.dev is pointing to my CloudFront distribution
- lets capture the security headers implementation details in CLAUDE.md