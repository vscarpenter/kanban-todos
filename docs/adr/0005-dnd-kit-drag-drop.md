# ADR-0005: @dnd-kit for Drag-and-Drop

**Status:** Accepted  
**Date:** 2024-01-15

## Context

A Kanban board's core interaction is dragging tasks between columns and reordering
within a column. This requires a robust drag-and-drop library that works reliably on
both desktop (mouse/keyboard) and mobile (touch), integrates with React's rendering
model, and doesn't balloon the initial bundle size.

Options considered:
- **react-beautiful-dnd** — popular but unmaintained since 2023; no active bug fixes or React 18 support
- **react-dnd** — flexible but low-level; requires significant custom code for touch support
- **Native HTML5 Drag and Drop API** — no touch support on iOS; not viable for a mobile-compatible app
- **@dnd-kit** — actively maintained, modular, accessibility-first, works on touch and pointer devices

## Decision

Use **@dnd-kit** (`@dnd-kit/core` + `@dnd-kit/sortable`) for all drag-and-drop interactions.

Key implementation choices:
- **Lazy-loaded** — the dnd-kit modules are dynamically imported (`next/dynamic`) so they are excluded from the initial page bundle, loaded only when the board view renders
- **iOS touch optimisations** — `TouchSensor` is configured with a delay and tolerance threshold to distinguish scrolling from drag intent, preventing accidental drags on touch devices
- **Keyboard accessibility** — `KeyboardSensor` with `sortableKeyboardCoordinates` enables full keyboard-driven reordering for accessibility compliance
- **Collision detection** — `closestCorners` algorithm used for column-to-column task moves; provides more predictable snap behaviour than the default `closestCenter`

## Consequences

### Positive
- **Active maintenance** — @dnd-kit is the de facto successor to react-beautiful-dnd with regular releases
- **Touch + mouse + keyboard** — single library covers all input modalities without polyfills or separate code paths
- **Modular bundle** — `@dnd-kit/core` and `@dnd-kit/sortable` are tree-shakeable; lazy loading further reduces initial load
- **Accessibility built-in** — screen reader announcements and keyboard navigation are supported out of the box via `announcements` and `KeyboardSensor`
- **Headless API** — no imposed styles; drag handles, overlays, and drop targets are fully custom React components

### Negative
- **iOS scroll vs. drag conflict** — without a configured touch delay, vertical scrolling on a touch device inadvertently triggers drags; requires careful `TouchSensor` tuning and real-device testing
- **Lazy load latency** — the first time a user interacts with the board, there is a small delay while dnd-kit loads; a loading indicator or prefetch hint is needed to avoid perceived jank
- **More setup than react-beautiful-dnd** — @dnd-kit's headless, composable model requires more wiring (sensors, collision detection, overlay portals) compared to the more opinionated rbd API
- **Complex multi-container logic** — moving items between columns (not just reordering within one) requires careful `onDragOver` and `onDragEnd` handler logic to update both Zustand store and UI state correctly
