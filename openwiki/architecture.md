# Architecture

Cascade is a **single-page, client-only** React app packaged as a Next.js static export. There is
no backend and no API server — every operation (CRUD, search, import/export) runs in the browser
against IndexedDB.

## Rendering & entry points

- `src/app/layout.tsx` — root layout. Defines all site metadata (SEO, Open Graph, PWA manifest,
  Apple/MS meta, viewport/theme color) and mounts the global **provider tree** inside `<body>`.
  Fonts are **platform fonts only** (font stacks declared in `src/app/globals.css`), intentionally
  no Google Fonts.
- `src/app/page.tsx` — the home route. Wraps the board in `FirstVisitGate`
  (`src/components/about/FirstVisitRedirect`) which redirects first-time visitors, then renders
  `<KanbanBoard />` inside `<main id="main-content">`.
- `src/app/error.tsx` — App Router error boundary.
- Static informational routes: `src/app/about`, `src/app/install`, `src/app/privacy`.

### Provider tree (from `layout.tsx`)

```
<ThemeProvider>            # next-themes, attribute="class", defaultTheme="system"
  <IOSClassProvider/>      # adds iOS-specific CSS classes (src/lib/utils/iosDetection.ts)
  <NotificationProvider/>  # wires the due/overdue notification manager
  {children}               # the board
  <InstallPWA/>            # PWA install prompt
  <PwaUpdater/>            # service worker registration + update toasts
  <Toaster/>               # sonner toast host
```

`ThemeProvider` deliberately does **not** disable transitions on change — `globals.css` crossfades
colors over ~200ms during theme swap.

## Board composition

`src/components/KanbanBoard.tsx` is the orchestrator (a `"use client"` component):

1. On mount, initializes all three stores in parallel:
   `Promise.all([initializeSettings(), initializeBoards(), initializeStore()])`.
2. Renders inside `<ClientOnly>` (`src/components/ClientOnly.tsx`) with a spinner fallback, so the
   IndexedDB-backed UI never runs during SSR/prerender.
3. Cross-store sync: an effect pushes the board store's `currentBoardId` into the task store's
   board filter (`setBoardFilter(currentBoardId)`). This is an intentional side effect between two
   external stores, not derived state.
4. Wires the notification manager when `settings.enableNotifications` is on, and listens for a
   custom `show-keyboard-shortcuts` DOM event.

Layout children: `Sidebar` (board list + dialogs), `SearchBar`, `BoardView` (the columns),
`GlobalHotkeys` and `KeyboardShortcutsDialog` (both lazy-loaded via `next/dynamic`).

## Drag and drop

Drag-and-drop uses `@dnd-kit`. `src/components/DragDropProvider.tsx` is **presentation-only**: it
configures `PointerSensor`/`TouchSensor` (touch gets a longer activation delay), chooses collision
detection (`closestCenter` on touch, `rectIntersection` on desktop), and renders the `DragOverlay`.
The actual drag *interaction* logic lives in `src/hooks/useDragLifecycle.ts` and is owned by the
board. `KanbanColumn`/`TaskCard` (`src/components/kanban/`) import `@dnd-kit/core` directly and are
part of the always-mounted board tree, so dnd is not fully lazy-loaded despite the dynamic wrapper.

## State layer

Three Zustand stores back the UI. `taskStore` is a **composition layer** that assembles action
creators from sibling modules; `boardStore` and `settingsStore` are single-file stores.
Components subscribe with selectors and dispatch actions; actions persist to IndexedDB and then
update store state. See [state-and-data.md](state-and-data.md) for the full breakdown.

## Data flow

```
user event (component)
   → store action (e.g. useTaskStore().addTask)
       → sanitize/validate (src/lib/utils/security.ts, taskValidation.ts)
       → taskDB mutation (src/lib/utils/database.ts → IndexedDB)
       → set(...) store state (recomputes filteredTasks via applyFiltersToTasks)
   → subscribed components re-render
```

Errors are captured per-store in an `error` field and surfaced as toasts by
`useStoreErrorToasts` (`src/lib/hooks/`).

## Where to start when changing this area

- Adding a provider or global behavior → `src/app/layout.tsx`.
- Changing board layout / initialization order → `src/components/KanbanBoard.tsx`.
- Changing drag behavior → `src/hooks/useDragLifecycle.ts` (logic) and
  `src/components/DragDropProvider.tsx` (sensors/overlay).
- Watch out for: SSR safety — anything touching `window`/IndexedDB must stay client-side (guarded
  by `ClientOnly` and `typeof window` checks). The build is a **static export**, so no server code,
  route handlers, or server actions are available.
