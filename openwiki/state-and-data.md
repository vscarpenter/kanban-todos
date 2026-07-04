# State & Data Layer

Cascade keeps all application state in three Zustand stores and persists it to a single IndexedDB
database. There is no network layer.

## The three stores

All stores live in `src/lib/stores/`.

### `useTaskStore` (`taskStore.ts` + modules)

The task store is a **composition layer**: `taskStore.ts` defines the state shape and wires action
creators imported from sibling modules (a deliberate split to keep files small):

- `taskStore.ts` — state, initial values, `initializeStore`, and validation/recovery helpers.
- `taskStore.crudActions.ts` — `addTask`, `updateTask`, `deleteTask`, `moveTask`,
  `moveTaskToBoard`, `archiveTask`, `unarchiveTask`. Each sanitizes input, writes to `taskDB`, then
  updates state with a **functional updater** (avoids stale state after `await`) and clears the
  search cache.
- `taskStore.filters.ts` — the filtering/search engine (see below).
- `taskStore.import.ts` — `exportTasks`, `importTasks`, `bulkAddTasks`.

State shape (`TaskState`): `tasks`, `filteredTasks`, `filters`, `searchState`, `isLoading`,
`isSearching`, `error`, `searchCache`.

`initializeStore()` guards for `window`, calls `taskDB.init()`, loads tasks, **rehydrates Date
fields** (IndexedDB stores serialize dates), sets `tasks`/`filteredTasks`, then loads search
preferences.

### `useBoardStore` (`boardStore.ts`, `boardStore.importActions.ts`)

Board CRUD, ordering, selection, and import/export. Key behaviors:

- `initializeBoards()` → `loadAndEnsureDefaultBoard()` creates a **default board if none exist**,
  `processAndOrderBoards()` backfills missing `order` and icon/dot fields on legacy boards and
  deserializes dates, and `restoreCurrentBoard()` restores the last-selected board from settings.
- Board helpers live in `src/lib/utils/boardHelpers.ts` (name validation, duplicate checks, order
  calculation, sanitized `createBoardObject`, reordering, `createDefaultBoard`).
- `setCurrentBoard` persists the selection **through `settingsStore`** — the settings store is the
  single owner of `Settings`, so board/task stores never write settings behind its back.

### `useSettingsStore` (`settingsStore.ts`)

Theme, auto-archive, notifications, keyboard shortcuts, current board id, search preferences, and
accessibility options. `ensureSettingsStructure()` deep-merges persisted settings over
`defaultSettings` so missing/legacy fields are backfilled safely.

Default settings (source: `settingsStore.ts`):

```ts
theme: 'system', autoArchiveDays: 30, enableNotifications: true,
enableKeyboardShortcuts: true,
searchPreferences: { defaultScope: 'current-board', rememberScope: true },
accessibility: { highContrast: false, reduceMotion: false, fontSize: 'medium' }
```

## Filtering & search engine (`taskStore.filters.ts`)

`applyFiltersToTasks(tasks, filters)` runs an **ordered early-exit** pipeline: board → status →
priority → tags (Set membership) → dateRange → text search (last, most expensive). For
**cross-board search** the board filter is skipped and results are limited to *accessible* tasks
(tasks on missing or archived boards are dropped).

Performance features:

- **Search cache** (`searchCache: Map`) with a **5-minute TTL** and **max 50 entries** (evicts when
  full). Cache keys are built from normalized filters (sorted tags, dateRange as ms). Cached
  entries are invalidated if their task IDs no longer exist; results with 1000+ items are not
  cached. The cache is cleared on any task mutation.
- Text search itself lives in `src/lib/utils/taskSearch.ts`: case-insensitive multi-word AND match
  over title/description/tags, with an optimized imperative path when there are >500 tasks.
- `applyFiltersWithRecovery` degrades gracefully (simplify filters → show all) if filtering throws.

## IndexedDB persistence (`src/lib/utils/database.ts`)

The `TaskDatabase` class wraps IndexedDB with an async/await API. The singleton is exported as
`taskDB`.

- **Database:** name `cascade-tasks`, `DB_VERSION = 1`.
- **Object stores** (created in `onupgradeneeded`):
  - `tasks` (keyPath `id`) with indexes on `boardId`, `status`, `archivedAt`, `dueDate`.
  - `boards` (keyPath `id`) with indexes on `isDefault`, `order`.
  - `settings` (keyPath `id`).
- **Multi-tab safety:** handles `onblocked` (rejects with a clear "close other tabs" message),
  `onversionchange`, and `onclose` so an upgrade in another tab can't hang the app.
- **Migration ladder:** upgrades are guarded by `oldVersion` so bumping `DB_VERSION` can add
  `if (oldVersion < N)` steps. The scaffold exists even though only version 1 is defined today.

> The archive is not a separate object store in the current v1 schema — archived tasks/boards are
> marked with an `archivedAt` timestamp and filtered out of the active view. (Some older docs
> mention an `archive` store; the code uses the `archivedAt` index instead.)

## Data model (types)

`src/lib/types/index.ts` is the **single source of truth**. Enum arrays drive both the type system
and runtime validators:

- `TASK_STATUSES = ['todo', 'in-progress', 'done']`, `TASK_PRIORITIES = ['low', 'medium', 'high']`.
- `Task`, `Board`, `Settings`, `TaskFilters`, `SearchScope`, `SearchState` interfaces.

See [domain.md](domain.md) for field-level semantics and business rules.

## Where to start when changing this area

- New task field → update `src/lib/types/index.ts`, then CRUD in `taskStore.crudActions.ts`,
  filters if searchable, validation schemas, and export/import serialization.
- Schema change (new store/index) → bump `DB_VERSION` and add a guarded migration step in
  `database.ts`; verify multi-tab upgrade paths.
- New enum value → add it **only** in `src/lib/types/index.ts`; validators/schemas derive from it.
- Watch out for: Date rehydration (IndexedDB serializes dates — always convert on load), and always
  invalidate/clear `searchCache` after mutations.
