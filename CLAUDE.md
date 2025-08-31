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
- **Framework**: Next.js 15.4.6 with App Router, static export
- **Language**: TypeScript (strict), shadcn/ui, Tailwind CSS v4
- **State**: Zustand stores + IndexedDB (custom TaskDatabase class)
- **Performance**: @dnd-kit lazy loaded, React.memo, dynamic imports

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

### State Management
Three main Zustand stores with IndexedDB persistence:
1. **useBoardStore**: Board CRUD, selection, import/export
2. **useTaskStore**: Task lifecycle, search, filtering, archive
3. **useSettingsStore**: Theme, auto-archive, accessibility, debug mode

### Database Layer
- IndexedDB wrapper with TaskDatabase class (async/await API)
- Object stores: tasks, boards, settings, archive
- Export/import with version control

### Key Features
- **Multi-Board System**: Unlimited boards with color coding
- **Task Management**: Full CRUD with drag-and-drop
- **Archive System**: Manual and automatic archiving
- **Privacy-First**: 100% client-side operation
- **Accessibility**: WCAG 2.1 AA compliance

## Archive

Implementation history documentation is archived in `archive/` directory:
- Accessibility improvements and WCAG compliance implementation
- Code quality reviews and build error resolution
- Bug fixes and technical solutions

Reference `archive/README.md` for complete index.

### Production Deployment
- **Primary**: `todos.vinny.dev` (S3 + CloudFront)
- **Secondary**: `cascade.vinny.dev` (S3 + CloudFront)  
- **Security**: CSP, HSTS, security headers policy
- **Cache**: 1-year static assets, no HTML cache, 5-min dynamic
- **Deploy**: `npm run deploy` or `./scripts/deploy-multi.sh`

### Performance
- Bundle: ~388kB with lazy loading, tree shaking, React.memo
- Memory: `src/lib/utils/memoryOptimization.ts` utilities
- Analysis: `npm run build:analyze`

### Keyboard Shortcuts
- **`N`** / **`Ctrl/Cmd + K`** - Create task
- **`Ctrl/Cmd + 1-9`** - Switch boards
- **`H`** - Keyboard shortcuts help
- **`F1`** - User guide
- **`Ctrl/Cmd + ,`** - Settings

Implementation: `src/lib/utils/keyboard.ts` with cross-platform support.