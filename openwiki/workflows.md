# Feature Workflows

Change-oriented guide to the app's cross-cutting features. Each section names the files you'd touch.

## Export / Import

Barrel `src/lib/utils/exportImport.ts` re-exports the implementation split under
`src/lib/utils/exportImport/` (`serialize.ts`, `exportData.ts`, `importData.ts`).

- **Format:** `DATA_FORMAT_VERSION = '1.0.0'`. `ExportData = { version, exportedAt, tasks[],
  boards[], settings? }`. Dates are serialized to ISO strings on export and re-hydrated on import.
- **Export** (`exportData.ts`): filter by `includeArchived` and/or specific `boardIds`;
  `validateAndSanitizeExport` validates, sanitizing only when warnings exist. `downloadAsJson`
  builds a Blob; `generateExportFilename` produces a date-stamped name. Store entry points:
  `useTaskStore().exportTasks`, `useBoardStore().exportBoards`, `useSettingsStore().exportSettings`.
- **Import** (`importData.ts`): `checkFormatVersionCompatibility` rejects only files with a **higher
  major version**. `validateImportData` runs schema + relationship checks. Options include
  `generateNewIds` and `skipConflicts`.

> Known caveat: import sanitization has two documented layers — structural sanitization (`sanitizeData`,
> live via `processAdvancedImport`) and XSS sanitization (`sanitizeTaskData`/`sanitizeBoardData`),
> the latter noted as **test-only** in the code (issue #89). Verify this before relying on it.

### File handling (`src/lib/utils/fileHandling.ts`)

`readJsonFile` enforces `.json` only, rejects empty files, caps size at **10MB** (warns above 1MB),
parses, and validates.

## Conflict detection & resolution

When imported data overlaps existing data, Cascade detects and resolves conflicts rather than
blindly overwriting.

- **Detection** (`src/lib/utils/exportImportHelpers.ts`): duplicate task/board IDs, default-board
  conflicts (matched by lowercase name), name conflicts, and orphaned tasks. Utilities:
  `regenerateBoardIds` / `regenerateTaskIds` (mint new UUIDs and remap `boardId` references),
  `filterConflictingItems`, `removeOrphanedTasks`.
- **Merge** (`src/lib/utils/conflictMerge.ts`): strategies `keep_existing`, `use_imported`,
  `merge_fields`, `keep_newer`, `keep_older`. Tags merge via set-union; `keep_newer` compares
  `updatedAt`; `generateUniqueBoardName` appends `(Copy N)`.
- **Orchestration** (`src/lib/utils/conflictResolution.ts`): per-entity strategies (`skip`,
  `overwrite`, `merge`, `rename`, `generate_new_ids`, `ask_user`) with a resolution log.

UI/state for import lives in `src/components/import/`, `src/components/ImportDialog.tsx`, and
`src/hooks/useImportState.ts`; export UI in `src/components/export-dialog/` +
`src/components/ExportDialog.tsx`.

## Search & filtering

Driven by `SearchBar`/`src/components/search/`, `src/hooks/useSearchState.ts`, and the task store's
filter engine (`taskStore.filters.ts`, `taskSearch.ts`). See
[state-and-data.md](state-and-data.md#filtering--search-engine-taskstorefiltersts) for the caching
and cross-board behavior.

## Keyboard shortcuts

`src/lib/utils/keyboard.ts` provides a singleton `KeyboardManager` (registers/matches shortcuts,
ignores input-focused elements). `src/components/GlobalHotkeys.tsx` binds them and
`KeyboardShortcutsDialog.tsx` documents them. Documented shortcuts (see `CLAUDE.md`): `N` or
`Ctrl/Cmd+K` create task, `Ctrl/Cmd+1-9` switch boards, `H` shortcuts help, `F1` user guide,
`Ctrl/Cmd+,` settings.

## Share a task

`src/lib/utils/shareTask.ts` + `src/components/ShareTaskDialog.tsx` generate markdown/plain-text
share content, `mailto:` links, and async clipboard copy (no `execCommand` fallback).

## Reset the app

`src/lib/utils/resetApp.ts` (via `src/components/AppResetDialog.tsx`) performs a full wipe: deletes
the `cascade-tasks` IndexedDB database, clears local/session storage and cookies, then reloads and
re-sets the "visited" flag.

## PWA & versioning

- `src/components/InstallPWA.tsx` — install prompt; `src/components/PwaUpdater.tsx` — service worker
  registration + update toasts.
- `src/components/VersionIndicator.tsx` shows build metadata injected at build time via
  `NEXT_PUBLIC_APP_VERSION` / `NEXT_PUBLIC_BUILD_*` env vars (see the `build` script in
  `package.json`).

## iOS / touch handling

`src/lib/utils/iosDetection.ts` detects iOS/iPadOS/Safari/WebView and version (targets iOS 18+),
plus touch capabilities. `src/components/IOSClassProvider.tsx` applies CSS classes; drag sensors in
`DragDropProvider.tsx` use touch-specific activation constraints.

## Where to start when changing this area

- New export field → `exportImport/serialize.ts` (serialize/deserialize) + the export/import
  schema in `validationSchemas.ts`.
- New conflict strategy → add to `conflictMerge.ts` and route it in `conflictResolution.ts`.
- New keyboard shortcut → register in `GlobalHotkeys.tsx` and document in
  `KeyboardShortcutsDialog.tsx`.
