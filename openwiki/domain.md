# Domain Model & Business Rules

This page captures the meaningful data shapes and the rules the app enforces. Everything derives
from `src/lib/types/index.ts` (types + enums) and the validation/utility modules cited below.

## Entities

### Task (`src/lib/types/index.ts`)

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | UUID (`crypto.randomUUID()`) |
| `title` | string | Required, non-empty after sanitization |
| `description?` | string | Optional |
| `status` | `'todo' \| 'in-progress' \| 'done'` | From `TASK_STATUSES` |
| `boardId` | string | Must reference an existing board |
| `createdAt` / `updatedAt` | Date | Set on create/update |
| `completedAt?` / `archivedAt?` | Date | Set when done / archived |
| `dueDate?` | Date | Drives notifications |
| `priority` | `'low' \| 'medium' \| 'high'` | From `TASK_PRIORITIES` |
| `tags` | string[] | Max 10 tags, 50 chars each |
| `progress?` | number | 0–100, meaningful only for `in-progress` tasks |

### Board

`id`, `name`, `description?`, `color`, `iconKey?`, `dotColor?`, `isDefault`, `order`, timestamps,
`archivedAt?`. The **default board** is created automatically when none exist:
`createDefaultBoard()` in `src/lib/utils/boardHelpers.ts` produces "Work Tasks" (color `#3b82f6`,
Briefcase icon, `isDefault: true`, `order: 0`).

### Settings

Theme (`light|dark|system`), `autoArchiveDays`, `enableNotifications`, `enableKeyboardShortcuts`,
`currentBoardId`, `searchPreferences` (`defaultScope`, `rememberScope`), and `accessibility`
(`highContrast`, `reduceMotion`, `fontSize`). Defaults are in `src/lib/stores/settingsStore.ts`.

## Enums are the single source of truth

Add new status/priority values **only** in `src/lib/types/index.ts`. The type system, runtime
integrity checks (`src/lib/utils/taskValidation.ts`), and JSON schemas
(`src/lib/utils/validationSchemas.ts`) all derive from `TASK_STATUSES` / `TASK_PRIORITIES`.

## Validation rules

### Schemas (`src/lib/utils/validationSchemas.ts`)

- Task: title 1–500 chars, description ≤ 2000, tags ≤ 50 chars / ≤ 20 items, progress 0–100,
  status/priority enums.
- Board: name 1–100, color must match `#RRGGBB`.
- Settings: `autoArchiveDays` **1–365**, theme enum.
- Export: `version` must match `\d+.\d+.\d+`.

### Relationship rules (`src/lib/utils/validation.ts` → `validateDataRelationships`)

- Every task must reference an existing board (orphans are flagged).
- A `done` task should have `progress = 100`; a `todo` task should have `progress = 0`.
- `updatedAt` and `completedAt` must be ≥ `createdAt`.
- Warns on duplicate board names and multiple default boards.

### Runtime integrity (`src/lib/utils/taskValidation.ts`)

`validateTaskIntegrity` / `validateTaskCollection` verify required fields, that dates are real
`Date` instances, that `tags` is an array, and that status/priority are valid — logging problems
without leaking user content.

## Security limits (`src/lib/utils/security.ts`)

`INPUT_LIMITS`: task title 200, task description 1000, board name 100, board description 500, tag
50, max tags 10, search query 500. `sanitizeTextInput` strips HTML tags/angle brackets, filters to
an allowed Unicode set, truncates, and collapses whitespace. `sanitizeTaskData` / `sanitizeBoardData`
are called from the CRUD action creators and board helpers.

> The primary XSS defense is React's escaping plus CSP headers; the sanitizer is defense-in-depth.
> Helpers `isValidUUID`, `sanitizeTaskId`, and the `searchRateLimiter` (10 requests / 1000ms) exist
> but are not currently wired into non-test code paths.

## Feature rules

### Auto-archive

Default `autoArchiveDays = 30` (range 1–365). Completed tasks older than the threshold are eligible
for automatic archiving; archiving sets `archivedAt` and removes the item from the active view.

### Notifications (`src/lib/utils/notifications.ts`)

A singleton `NotificationManager` (mounted via `NotificationProvider`) polls **every 5 minutes**,
firing browser notifications for tasks **due within 1 hour** and for overdue tasks, deduping
repeats and skipping done/archived tasks. Gated by `settings.enableNotifications` and browser
permission.

### Completion celebration (`src/lib/utils/celebrateCompletion.ts`)

Moving a task to `done` triggers a lazy-loaded, CSP-safe confetti burst plus a toast, and respects
the reduced-motion accessibility setting.

### Search scope

`current-board` vs `all-boards`. When `rememberScope` is enabled the chosen scope is persisted via
the settings store; cross-board search only returns tasks on accessible (non-archived, existing)
boards.

## Where to start when changing this area

- New validation rule → `validationSchemas.ts` (shape) and/or `validation.ts` (relationships), plus
  runtime guard in `taskValidation.ts`.
- New input field limit → `INPUT_LIMITS` and the relevant `sanitize*` function in `security.ts`.
- Changing default board / notification timing / auto-archive default → `boardHelpers.ts`,
  `notifications.ts`, `settingsStore.ts` respectively.
