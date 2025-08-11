# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm run dev` - Start development server on http://localhost:3000
- `npm run build` - Build for production with static export 
- `npm run start` - Start production server
- `npm run lint` - Run ESLint with Next.js configuration

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
- **Drag & Drop**: @dnd-kit for accessible kanban interactions
- **Icons**: Lucide React
- **Notifications**: Sonner for toast messages

### Project Structure
```
src/
├── app/                 # Next.js App Router
│   ├── layout.tsx      # Root layout with Inter/JetBrains Mono fonts
│   └── page.tsx        # Main application entry point
├── components/         # React components
│   ├── ui/            # shadcn/ui base components
│   ├── kanban/        # Kanban-specific components (KanbanColumn, TaskCard)
│   ├── KanbanBoard.tsx # Main board orchestrator
│   ├── Sidebar.tsx    # Navigation and board management
│   └── *Dialog.tsx    # Feature dialogs (Create, Edit, Settings, etc.)
└── lib/
    ├── stores/        # Zustand state management
    ├── types/         # TypeScript type definitions
    ├── utils/         # Utility functions and database layer
    └── utils.ts       # Common utilities (cn function)
```

### State Management Architecture
Three main Zustand stores with IndexedDB persistence:

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
- **Drag & Drop**: @dnd-kit with keyboard accessibility
- **Theme System**: next-themes with CSS custom properties
- **Typography**: Inter for body text, JetBrains Mono for code
- **Responsive Design**: Mobile-first with sidebar toggle
- **Client-Side Rendering**: ClientOnly wrapper for hydration safety

### Data Flow
1. App initialization loads all stores from IndexedDB
2. Board selection triggers task filtering by boardId
3. Task operations update both Zustand state and IndexedDB
4. Real-time UI updates via Zustand subscriptions
5. Export/import preserves complete application state

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
- Zustand middleware includes devtools and persistence
- Theme switching preserves user preference across sessions