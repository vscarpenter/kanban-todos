# Cascade - Task Management System

A modern, privacy-first kanban board task management system built with Next.js, TypeScript, and Tailwind CSS. Features a clean, accessible interface with advanced typography and responsive design.

## ✨ Features

### Core Functionality
- **Multi-Board Management**: Create and manage multiple kanban boards
- **Task Organization**: Drag-and-drop tasks between columns (Todo, In Progress, Done)
- **Board Customization**: Custom colors and descriptions for each board
- **Data Persistence**: Local storage with export/import capabilities
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
│   ├── Sidebar.tsx       # Navigation sidebar
│   ├── KanbanBoard.tsx   # Main board interface
│   ├── TaskCard.tsx      # Individual task cards
│   └── ...               # Other feature components
└── lib/                  # Utilities and stores
    ├── stores/           # Zustand state stores
    ├── types/            # TypeScript type definitions
    ├── utils/            # Utility modules (database, export/import, keyboard, etc.)
    └── utils.ts          # Base helpers (e.g., cn)
```

## 🧭 Architecture Overview

- Rendering: Next.js App Router in `src/app` renders the shell (`layout.tsx`) and the board UI (`page.tsx`). UI is composed from `src/components` with Tailwind CSS and shadcn/ui primitives. Drag-and-drop uses `@dnd-kit`.
- State: Lightweight stores in `src/lib/stores` using Zustand. Components subscribe via selectors and dispatch store actions (e.g., board create/update, task moves).
- Persistence: `src/lib/utils/database.ts` wraps IndexedDB for tasks, boards, settings, and archive. Stores call `taskDB` to read/write; settings (e.g., current board) persist across sessions. Export/import flows use JSON helpers in `src/lib/utils/exportImport.ts`.
- Types & Utilities: Shared types in `src/lib/types`, helpers in `src/lib/utils` (keyboard, validation, notifications, conflict resolution, memory optimization).
- Testing: Unit tests (Vitest + Testing Library, jsdom) live next to code or under `__tests__`; E2E tests (Playwright) live in `e2e/`. Global test setup is `src/test/setup.ts`.
- Data Flow: User action → component event → store action → optional `taskDB` mutation → store state update → subscribed components re-render. Import/export and archive travel the same path through store APIs.

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
