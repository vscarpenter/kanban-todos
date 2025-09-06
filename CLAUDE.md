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
│   ├── accessibility/ # Accessibility-enhanced components
│   │   ├── AccessibleButton.tsx # WCAG-compliant button wrapper
│   │   └── AccessibleInput.tsx  # Screen reader optimized input
│   ├── DragDropProvider.tsx # Lazy-loaded drag-and-drop wrapper
│   ├── IOSClassProvider.tsx # iOS device detection and CSS class provider
│   ├── KanbanBoard.tsx # Main board orchestrator
│   ├── Sidebar.tsx    # Navigation with lazy-loaded dialogs
│   ├── UpdateNotification.tsx # Service worker update notifications
│   ├── VersionIndicator.tsx   # Build version display
│   ├── ConfirmationDialog.tsx # Styled confirmation dialogs
│   ├── DeleteTaskDialog.tsx   # Task deletion confirmation
│   ├── AppResetDialog.tsx     # Application reset confirmation
│   └── *Dialog.tsx    # Feature dialogs (dynamically imported)
├── docs/              # Comprehensive documentation
│   ├── README.md      # Documentation index
│   ├── getting-started.md
│   ├── user-guide.md
│   ├── developer-guide.md
│   ├── api-reference.md
│   └── testing-guide.md
└── lib/
    ├── stores/        # Zustand state management
    ├── types/         # TypeScript type definitions
    ├── utils/         # Utility functions and database layer
    │   ├── database.ts         # IndexedDB wrapper
    │   ├── memoryOptimization.ts # Memory optimization utilities
    │   ├── resetApp.ts         # App reset functionality
    │   ├── iosDetection.ts     # iOS device detection utilities
    │   ├── versionManagement.ts # Version comparison and update handling
    │   ├── security.ts         # Input sanitization and XSS prevention
    │   ├── errorHandling.ts    # Comprehensive error handling system
    │   ├── accessibility.ts    # Accessibility utility functions
    │   └── deploymentValidator.ts # Production deployment validation
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
- **iOS Optimization**: Enhanced iOS Safari support with touch detection
- **Accessibility**: WCAG 2.1 AA compliance with screen reader support
- **Security**: Input sanitization, XSS prevention, CSP headers
- **Error Handling**: Comprehensive error recovery and user feedback
- **Version Management**: Service worker updates and cache busting
- **Native Dialog Replacement**: Styled confirmation dialogs

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
- Memory optimization: `src/lib/utils/memoryOptimization.ts` utilities (debounce, throttle, cleanup)
- Analysis: `npm run build:analyze`

### Keyboard Shortcuts
- **`N`** / **`Ctrl/Cmd + K`** - Create task
- **`Ctrl/Cmd + 1-9`** - Switch boards
- **`H`** - Keyboard shortcuts help
- **`F1`** - User guide
- **`Ctrl/Cmd + ,`** - Settings

Implementation: `src/lib/utils/keyboard.ts` with cross-platform support.

## iOS Support & Touch Optimization

### iOS Device Detection
- **Enhanced Detection**: `src/lib/utils/iosDetection.ts` provides comprehensive iOS device detection
- **Version Checking**: Targets iOS 18+ Safari for optimal compatibility
- **Touch Capabilities**: Detects touch support, pointer precision, and hover capabilities
- **Device Classification**: Mobile, tablet, desktop categorization
- **CSS Classes**: Automatic iOS-specific class application via `IOSClassProvider`

### Touch Optimization Features
- **Drag & Drop**: iOS-optimized touch sensor configuration for @dnd-kit
- **Activation Constraints**: Device-specific delay and tolerance settings
- **Safari Compatibility**: Enhanced compatibility with iOS Safari touch events
- **Layout Handling**: Improved long URL handling in input components

## Security & Data Protection

### Input Sanitization
- **Text Sanitization**: `src/lib/utils/security.ts` provides comprehensive input cleaning
- **XSS Prevention**: HTML tag removal, dangerous protocol blocking
- **Length Limits**: Configurable input length restrictions per field type
- **Pattern Validation**: Character allowlists for different input types
- **File Validation**: Safe file upload validation for import operations

### Content Security Policy
- **CSP Headers**: Generated security headers for production deployment
- **Rate Limiting**: Search operation throttling to prevent abuse
- **UUID Validation**: Secure ID validation for tasks and boards
- **JSON Validation**: Safe JSON parsing for import operations

## Error Handling & Recovery

### Comprehensive Error System
- **Error Classification**: `src/lib/utils/errorHandling.ts` with severity levels
- **Recovery Strategies**: Automatic retry with exponential backoff
- **User Feedback**: Context-aware error messages
- **Database Recovery**: IndexedDB corruption detection and cleanup
- **Operation Context**: Detailed error tracking with user agent and URL

### Error Boundary Integration
- **React Error Boundaries**: Component-level error containment
- **Fallback Actions**: Graceful degradation strategies
- **Error Logging**: Development and production error tracking

## Version Management & Updates

### Service Worker Updates
- **Update Detection**: `src/lib/utils/versionManagement.ts` handles version comparison
- **Update Notifications**: `UpdateNotification` component with release notes
- **Cache Busting**: Automatic cache invalidation on updates
- **User Preferences**: Update notification settings and dismissal tracking

### Build Information
- **Version Display**: `VersionIndicator` component shows current build info
- **Build Metadata**: Timestamp, hash, and version tracking
- **Environment Variables**: Production build information integration

## Documentation System

### Comprehensive Documentation
- **User Documentation**: Complete user guides and getting started materials
- **Developer Documentation**: Architecture, API reference, and development setup
- **Testing Documentation**: Testing strategies and best practices
- **Deployment Documentation**: Production deployment and monitoring guides

### Documentation Structure
Located in `docs/` directory with the following guides:
- `getting-started.md` - Quick start and installation
- `user-guide.md` - Complete feature documentation
- `developer-guide.md` - Development setup and architecture
- `api-reference.md` - Technical API documentation
- `testing-guide.md` - Testing procedures and coverage

## Enhanced Accessibility

### WCAG 2.1 AA Compliance
- **Accessible Components**: `src/components/accessibility/` with enhanced screen reader support
- **Keyboard Navigation**: Full keyboard accessibility with focus management
- **Aria Support**: Comprehensive ARIA attributes and descriptions
- **Announcement System**: Screen reader announcements for dynamic actions
- **Focus Management**: Automatic focus handling and visual indicators

### Accessibility Utilities
- **AccessibilityManager**: Centralized accessibility management class
- **Aria Helpers**: Utility functions for dynamic ARIA attribute management
- **Screen Reader Support**: Optimized content for assistive technologies