# Cascade - Task Management System

[![Version](https://img.shields.io/badge/version-3.0.1-blue.svg)](https://github.com/vscarpenter/kanban-todos)
[![Build](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org/)

A modern, privacy-first kanban board task management system built with Next.js, TypeScript, and Tailwind CSS. Features a clean, accessible interface with advanced typography and responsive design.

> **Version 3.0.1** includes major internal refactoring for improved code quality and maintainability while maintaining 100% backward compatibility.

## ✨ Features

### Core Functionality
- **Multi-Board Management**: Create and manage multiple kanban boards
- **Task Organization**: Drag-and-drop tasks between columns (Todo, In Progress, Done)
- **Board Customization**: Custom colors and descriptions for each board
- **Data Persistence**: Stored locally with IndexedDB with export/import capabilities
- **Archive System**: Archive completed tasks and boards
- **Theme Support**: Light and dark mode with system preference detection

### User Experience
- **Responsive Design**: Optimized for desktop and mobile devices
- **Accessibility**: WCAG compliant with keyboard navigation support
- **Modern Typography**: Professional typography system with Inter and JetBrains Mono fonts
- **Clean Interface**: Minimalist design focused on productivity
- **User Guide**: Built-in help system and user guidance

### Technical Features
- **Privacy-First**: All data stored locally, no external tracking
- **Performance Optimized**: Fast loading with Next.js App Router
- **Type Safety**: Full TypeScript implementation
- **Component Library**: Built with shadcn/ui components
- **State Management**: Zustand for efficient state handling

## 🚀 Getting Started

- Prerequisites: Node.js 20+ and npm 10+.
- Install dependencies: `npm install`
- Start dev server: `npm run dev` then open `http://localhost:3000`
- Build for production: `npm run build`
- Run production build: `npm start`

## 🛠️ Tech Stack

- Framework: Next.js 15 (App Router), React 19
- Language: TypeScript
- Styling: Tailwind CSS v4
- UI: shadcn/ui, Lucide icons
- State: Zustand stores
- Persistence: IndexedDB via `taskDB` with JSON export/import
- Theme: `next-themes` for dark/light mode
- Testing: Vitest + Testing Library (jsdom), Playwright for E2E
- Tooling: ESLint (Next.js config), TypeScript, Dockerfile for containerization

### Docker Deployment

#### Build and Run Locally

1. Build the Docker image:
```bash
docker build -t kanban-todos:latest .
```

2. Run the container:
```bash
docker run -p 3000:3000 --name kanban-todos kanban-todos:latest
```

3. Access the app at [http://localhost:3000](http://localhost:3000)

#### Push to Registry

1. Tag the image (example for Docker Hub):
```bash
docker tag kanban-todos:latest <your-username>/kanban-todos:latest
```

2. Push the image:
```bash
docker push <your-username>/kanban-todos:latest
```

#### Kubernetes Deployment

1. Create a Kubernetes deployment manifest referencing your pushed image.
2. Expose the deployment via a Service (NodePort, LoadBalancer, or Ingress).
3. Example minimal deployment:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
    name: kanban-todos
spec:
    replicas: 1
    selector:
        matchLabels:
            app: kanban-todos
    template:
        metadata:
            labels:
                app: kanban-todos
        spec:
            containers:
            - name: kanban-todos
                image: <your-repo>/kanban-todos:latest
                ports:
                - containerPort: 3000
---
apiVersion: v1
kind: Service
metadata:
    name: kanban-todos
spec:
    type: NodePort
    ports:
    - port: 3000
        targetPort: 3000
        nodePort: 32000
    selector:
        app: kanban-todos
```

4. Apply with:
```bash
kubectl apply -f <manifest.yaml>
```


## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── globals.css        # Global styles and typography system
│   ├── layout.tsx         # Root layout with font configuration
│   └── page.tsx           # Main application page
├── components/            # React components
│   ├── ui/               # shadcn/ui base components
│   ├── kanban/           # Kanban-specific components
│   ├── board/            # Board management components
│   ├── sidebar/          # Sidebar components
│   ├── accessibility/    # WCAG-compliant components
│   └── ...               # Feature components and dialogs
└── lib/                  # Utilities and stores
    ├── stores/           # Zustand state stores (modular architecture)
    │   ├── taskStore.ts            # Main task store (composition layer)
    │   ├── taskStoreActions.ts     # CRUD operations
    │   ├── taskStoreFilters.ts     # Filter and search operations
    │   ├── taskStoreSearch.ts      # Search navigation
    │   ├── taskStoreImportExport.ts # Import/export operations
    │   ├── taskStoreValidation.ts  # Validation and error handling
    │   ├── taskStoreHelpers.ts     # Helper functions
    │   ├── boardStore.ts           # Board management
    │   └── settingsStore.ts        # Application settings
    ├── types/            # TypeScript type definitions
    ├── utils/            # Utility modules
    │   ├── database.ts            # IndexedDB wrapper
    │   ├── exportImport.ts        # Export/import logic
    │   ├── exportImportHelpers.ts # Import/export helpers
    │   ├── validation.ts          # Data validation
    │   ├── security.ts            # Input sanitization
    │   ├── taskFiltering.ts       # Task filtering utilities
    │   └── ...                    # Other utilities
    └── utils.ts          # Base helpers (e.g., cn)
```

## 🧭 Architecture Overview

### Modular Store Architecture (v3.0+)
Version 3.0 introduces a modular store architecture for improved maintainability and code organization:

- **Rendering**: Next.js App Router in `src/app` renders the shell (`layout.tsx`) and the board UI (`page.tsx`). UI is composed from `src/components` with Tailwind CSS and shadcn/ui primitives. Drag-and-drop uses `@dnd-kit`.

- **State Management**: Modular Zustand stores in `src/lib/stores`:
  - Main `taskStore.ts` acts as a composition layer (190 lines, down from 879)
  - Separated concerns into focused modules:
    - **Actions**: CRUD operations for tasks
    - **Filters**: Search and filtering logic with caching
    - **Search**: Navigation and search preferences
    - **Import/Export**: Bulk data operations
    - **Validation**: Error handling and data integrity
    - **Helpers**: Shared utility functions
  - Components subscribe via selectors and dispatch store actions

- **Persistence**: `src/lib/utils/database.ts` wraps IndexedDB for tasks, boards, settings, and archive. Stores call `taskDB` to read/write; settings persist across sessions. Export/import uses modular helpers in `exportImport.ts` and `exportImportHelpers.ts`.

- **Types & Utilities**: Shared types in `src/lib/types`, utilities in `src/lib/utils` organized by concern (keyboard, validation, notifications, security, filtering, memory optimization).

- **Testing**: Unit tests (Vitest + Testing Library, jsdom) live next to code or under `__tests__`; E2E tests (Playwright) live in `e2e/`. Global test setup is `src/test/setup.ts`.

- **Data Flow**: User action → component event → store action → optional `taskDB` mutation → store state update → subscribed components re-render. Import/export and archive operations follow the same pattern through store APIs.

### Code Quality Standards
The codebase follows strict quality guidelines:
- Functions kept under 30 lines for readability
- Single Responsibility Principle applied throughout
- YAGNI (You Aren't Gonna Need It) - unused code removed
- DRY (Don't Repeat Yourself) - common patterns extracted
- Comprehensive TypeScript types for safety

## 🎯 Usage

### Creating Boards
1. Click the "+" button next to "Boards" in the sidebar
2. Enter board name, description, and choose a color
3. Click "Create Board" to add it to your workspace

### Managing Tasks
1. Select a board from the sidebar
2. Click "Add Task" in any column to create new tasks
3. Drag and drop tasks between columns to update their status
4. Click on tasks to edit details, add descriptions, or archive them

### Data Management
- **Export**: Use "Export Data" to download your boards and tasks as JSON
- **Import**: Use "Import Data" to restore from a previously exported file
- **Archive**: Archive completed tasks to keep your boards clean

## 🔒 Security Headers Governance

- CloudFront response headers policy is the production source of truth for security headers and CSP.
- Header/CSP drift checks are versioned in `docs/security-headers-baseline.json`.
- Validate live environments with:
  - `npm run security:headers:check`
- Automated validation runs via GitHub Actions:
  - `.github/workflows/security-headers-check.yml`
- Note: Next.js `headers()` is intentionally not used for production enforcement because this app is deployed with static export (`output: 'export'`).

## 🔧 Configuration

### Typography Customization
The typography system can be customized in `src/app/globals.css`:
- Heading styles and hierarchy
- Font feature settings
- Line heights and spacing
- Text wrapping behavior

### Theme Customization
Colors and design tokens are defined in the CSS custom properties within `globals.css` for both light and dark themes.

## 📱 Browser Support

- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons by [Lucide](https://lucide.dev/)
- Typography powered by [Geist](https://vercel.com/font) and [Geist Mono](https://vercel.com/font)
- Development assistance from [Claude Code](https://claude.ai/code)
