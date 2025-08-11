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

### Prerequisites

1. Clone the repository:

2. Install dependencies:
```bash
npm install
# or
yarn install
# or

3. Run the development server:
```bash
npm run dev
# or
yarn dev
# or

### Installation (Local Development)

1. Clone the repository:
```bash
```

```

2. Install dependencies:
```bash
4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.


## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15.4.6 (App Router)
```

3. Run the development server:
```bash
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **Fonts**: Geist (body), Geist Mono (code) with enhanced OpenType features

### State Management & Storage
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

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
- **State**: Zustand stores
- **Persistence**: Local Storage with JSON export/import
- **Theme**: next-themes for dark/light mode

### Development Tools
- **Linting**: ESLint with Next.js configuration
- **Animations**: Tailwind CSS animations with tw-animate-css
- **Notifications**: Sonner for toast notifications

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
    ├── types.ts          # TypeScript type definitions
    └── utils.ts          # Utility functions
```

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
