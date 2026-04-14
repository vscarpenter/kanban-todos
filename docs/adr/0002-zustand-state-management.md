# ADR-0002: Zustand for State Management

**Status:** Accepted  
**Date:** 2024-01-15

## Context

The app requires shared client-side state for tasks, board configuration, and user
settings — all of which must stay in sync with IndexedDB and update the UI reactively.
We need a state management solution that integrates cleanly with React, avoids
boilerplate, and scales across multiple distinct data domains.

Options considered:
- **React Context + useReducer** — built-in, but causes excessive re-renders and lacks devtools
- **Redux Toolkit** — powerful but heavyweight; overkill for a client-only app with no server state
- **Zustand** — minimal API, fine-grained subscriptions, easy to split into multiple stores
- **Jotai / Recoil** — atom-based; good for granular state but less natural for entity collections

## Decision

Use Zustand, splitting state into three focused stores:
- **`taskStore.ts`** — task CRUD operations, active task tracking, IndexedDB sync
- **`boardStore.ts`** — board/column layout, column ordering, Kanban structure
- **`settingsStore.ts`** — user preferences (theme, display options, export settings)

Each store owns its own slice of IndexedDB interaction, keeping concerns separated.
Stores are consumed directly in components via `useTaskStore()`, `useBoardStore()`, etc.

## Consequences

### Positive
- **Minimal boilerplate** — no actions, reducers, or dispatchers; stores are plain objects with setters
- **Fine-grained re-renders** — components subscribe only to the specific state slices they use
- **Easy store splitting** — three stores map cleanly to three IndexedDB object stores
- **No Provider wrapping** — stores are module-level singletons; no context tree required
- **Good devtools support** — Zustand middleware integrates with Redux DevTools for time-travel debugging

### Negative
- **No built-in derived state** — computed values (e.g., task counts per column) must be memoised manually with `useMemo` or Zustand's `subscribeWithSelector`
- **Manual IndexedDB sync** — each store must implement its own persistence logic; there is no automatic two-way binding between Zustand and IndexedDB
- **Cross-store coordination** — actions that affect multiple stores (e.g., deleting a board and its tasks) require explicit calls into both stores, which can scatter related logic
- **Less structure than Redux** — freedom from boilerplate also means fewer conventions to enforce consistency across stores
