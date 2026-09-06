# WebMCP tool layer for Cascade

**Status:** Approved 2026-09-05
**Scope:** Phase 1 (tool layer), Phase 2 (bridge to Claude Code), Phase 3 (tests)

## Goal

Agents running on the same Mac can use Cascade as their task tracker. The page registers a
small set of WebMCP tools. An agent reads the board, creates tasks, moves them between
columns, updates details, and deletes them. The board the user sees and the board the agent
sees are the same IndexedDB data, updated live through the same store actions the UI uses.

Nothing here adds a server, a network call, or a second copy of the data.

## What we verified before designing

Checked on 2026-09-05 against the live spec draft (dated 2026-09-04), the Chrome developer
docs, Chromium source, and Chrome 152.0.7977.82 on this Mac.

- The API lives on `document.modelContext`. In Chrome 152, `navigator.modelContext` is
  undefined, so no alias exists in this build. We still feature-detect the navigator form as a
  fallback because it costs nothing.
- `registerTool(tool, { signal })` rejects a duplicate name with `InvalidStateError`.
  Aborting the signal unregisters the tool and fires `toolchange`.
- `getTools()` returns records with name, title, description, inputSchema, origin, window,
  and annotations. There is no `execute` on the record; callers use `executeTool`.
- `executeTool(tool, input)` in Chrome 152 accepts a JSON string. Passing an object fails
  with "Failed to parse input arguments". The spec types the argument as an object, so
  bridges and tests must send a string and be ready for the object form later.
- The execute callback may receive an options object without a signal. Handlers must not
  assume `options.signal` exists.
- The flag is `chrome://flags/#enable-webmcp-testing`, mapped in `about_flags.cc` to the
  Blink feature `kWebMCP`. The runtime feature name is `WebMCP`.

## Domain language

CONTEXT.md names the unit of work a Task and asks us to avoid "card." Tool names and
parameters use task. Columns are not stored data; they are the fixed status enum
`todo`, `in-progress`, `done`. Tools take and return `status`, and every description says
"column" so agents thinking in kanban terms find the right tool.

## Architecture

```
document.modelContext
      ▲ registerTool / toolchange
      │
src/lib/webmcp/index.ts        registerCascadeTools(), unregisterCascadeTools()
      │
src/lib/webmcp/tools/*.ts      one ModelContextTool per operation
      │ validate input, call store action, serialize result
      ▼
useTaskStore / useBoardStore   the same Zustand actions the dialogs and drag path call
      ▼
taskDB (IndexedDB)             unchanged, schema version 1
```

Store actions already form a clean per-operation seam: `addTask`, `updateTask`,
`moveTask`, `moveTaskToBoard`, `deleteTask`. Each writes through `taskDB`, then updates
store state with a functional updater, so subscribed components re-render. The tool layer
calls `useTaskStore.getState()` and `useBoardStore.getState()` and never touches IndexedDB
directly.

One refactor is needed: `addTask` and `updateTask` currently return `Promise<void>`. The tool
layer needs the resulting Task to hand back to the agent. They will return the created or
updated Task instead. Existing callers ignore the return value, so nothing else changes.
This lands in its own commit.

### Files

```
src/lib/webmcp/
  index.ts          registerCascadeTools(), unregisterCascadeTools(), one AbortController
  detect.ts         getModelContext(): document.modelContext, then navigator, then null
  types.ts          ModelContext, ModelContextTool, RegisteredTool, ToolAnnotations,
                    plus global augmentation of Document and Navigator
  status.ts         useWebMcpStatusStore: status and tool count for the indicator
  schemas.ts        JSON Schema per tool, every property described, explicit required lists
  validate.ts       small input validators that throw plain Errors with clear messages
  serialize.ts      Task and Board to agent-facing JSON, Dates as ISO strings
  tools/boards.ts   cascade_list_boards, cascade_get_board
  tools/tasks.ts    cascade_list_tasks, cascade_get_task, cascade_create_task,
                    cascade_update_task, cascade_move_task, cascade_delete_task
  __tests__/        detect, register, boards tools, tasks tools
src/components/WebMcpIndicator.tsx     dot plus label in the sidebar footer card
src/components/VersionIndicator.tsx    renders the indicator under the build date
src/components/KanbanBoard.tsx         registers after the three stores initialize
src/lib/types/index.ts                 TASK_STATUS_LABELS (single source for column labels)
docs/webmcp.md                         setup, bridge, smoke test, manual checklist
docs/adr/0006-webmcp-tool-layer.md     decision record
e2e/webmcp.spec.ts                     opt-in real-browser smoke test
```

### Registration lifecycle

1. `KanbanBoard` already initializes settings, boards, and tasks in parallel. When that
   promise settles, an effect calls `registerCascadeTools()`. Its cleanup calls
   `unregisterCascadeTools()`.
2. `registerCascadeTools()` feature-detects. When no API exists it logs one info line
   through the project logger and returns `unsupported`. The app behaves exactly as today.
3. When the API exists, it aborts any previous controller, creates a new one, and registers
   each tool with that signal. Registration is sequential so a failure names the tool.
4. React strict mode in development mounts, unmounts, and mounts again. The cleanup aborts
   mid-registration; later `registerTool` calls reject with the abort reason. That case is
   treated as a cancellation, not an error, and the second mount registers cleanly.
5. The status store records `registered` with the tool count, `unsupported`, or `error`.
   A `toolchange` listener recounts `cascade_` tools so the indicator stays truthful.

Note: `next.config.ts` strips all console output from production builds. The info line
shows in development and in any build where that setting is relaxed. Changing that setting
is outside this work and is flagged in the summary.

## Tool contract

Every name uses the `cascade_` prefix, snake_case, no dots. Inputs and outputs use the data
model's camelCase field names so what an agent sends matches what it reads back. Every read
sets `readOnlyHint: true` and `untrustedContentHint: true`, because titles and descriptions
are user content. Delete sets `consequentialHint: true`.

Every execute validates its input and rejects with a plain Error carrying a clear message.
Success resolves to `{ ok: true, ... }`. Failure always rejects; no tool returns
`ok: false`.

| Tool | Input | Output |
| --- | --- | --- |
| `cascade_list_boards` | none | `currentBoardId`, `boards[]` with id, name, description, isDefault, order, archived, and `counts` (todo, inProgress, done, archived) |
| `cascade_get_board` | `boardId?` (default: the board on screen) | `board` summary plus `columns[]` in order, each with status, label, count |
| `cascade_list_tasks` | `boardId?`, `allBoards?`, `status?`, `priority?`, `tag?`, `query?`, `includeArchived?`, `limit?` (default 50, max 200) | `total`, `returned`, `truncated`, `tasks[]` compact: id, title, status, priority, tags, dueDate, progress, archived, boardId, updatedAt |
| `cascade_get_task` | `taskId` | `task` in full: every field, dates as ISO strings, plus boardName |
| `cascade_create_task` | `title`, `description?`, `boardId?`, `status?` (default todo), `priority?` (default medium), `tags?`, `dueDate?` | `task` in full |
| `cascade_update_task` | `taskId` plus any of `title`, `description` (null clears), `priority`, `tags` (replaces), `dueDate` (null clears), `progress` | `task` in full |
| `cascade_move_task` | `taskId`, `status`, `boardId?` | `changed` (false when already there), `task` in full |
| `cascade_delete_task` | `taskId` | `deleted` with id, title, boardId |

Rules the tools inherit rather than restate:

- Sanitization and length limits come from `sanitizeTaskData` inside the store actions.
- Status transitions come from `moveTask`: done sets progress 100 and completedAt; leaving
  done clears completedAt; entering in-progress from todo sets progress 0.
- `cascade_create_task` adds the task as todo, then calls `moveTask` when another status
  was requested, so a task created as done carries completedAt.
- `cascade_move_task` calls `moveTaskToBoard` first when the board changes, then `moveTask`
  when the status changes. Both unchanged means no write and `changed: false`.
- `progress` on update is accepted only for tasks already in progress, matching the dialog.
- Listing uses `applyFiltersToTasks` and `searchTasks`, the same engine the search bar uses.
  Archived tasks are excluded unless asked for, matching the board view.

## Indicator

A dot and a short label under the build date in the sidebar footer card. "Agent tools on"
with the ok token when tools are registered, "Agent tools off" with the muted ink token
otherwise. The title attribute explains why (tool count, or that the browser lacks the
API). It reuses the footer's existing type sizes and tokens and adds no new layout.

## Error handling

- Validation errors reject before any store call, so no toast fires.
- Store failures set the store's `error` and throw. The existing toast hook shows the
  message to the user, and the tool rejects with the same message to the agent.
- Registration failures log through the project logger and set status `error`.

## Testing

- Unit tests under `src/lib/webmcp/__tests__/` run each tool's execute against the real
  store actions and the real `TaskDatabase` on `fake-indexeddb`. They call `vi.unmock` on
  the database module, restore a real `crypto.randomUUID`, and reset the database between
  tests. Registration tests use a small fake ModelContext that honors abort signals.
- `e2e/webmcp.spec.ts` is opt-in through `WEBMCP_E2E=1`. It launches the installed Chrome
  with `--enable-features=WebMCP`, calls `getTools()` and `executeTool()` in the page, and
  asserts the DOM reflects each write. The bundled Playwright Chromium is 151, which may lack
  the consumer API, so the project uses the `chrome` channel.
- `docs/webmcp.md` carries the manual checklist for the bridge path.

## Bridge (Phase 2)

Primary: the WebMCP Bridge Chrome extension from agentcathq/webmcp-react plus the
`webmcp-server` npm package, added with
`claude mcp add --transport stdio webmcp-server -- npx webmcp-server`. It reads
`document.modelContext` through `getTools` and `executeTool`, listens for `toolchange`, and
forwards aborts. Known gap: it drops annotations, so no consequential confirmation reaches
Claude Code. Fallback: littleplato/webmcp-cdp-bridge over the DevTools Protocol, which needs
a two-line patch for the current spec.

## Out of scope

Multi-user sync, a backend, authentication, cross-origin exposure (`exposedTo` stays unset),
browsers other than Chrome, board creation and deletion, archiving, task ordering within a
column, and an origin trial token for the deployed site.

## Acceptance criteria

1. With the flag off, the app behaves as today and logs one info line in development.
2. With the flag on, `document.modelContext.getTools()` lists eight `cascade_` tools with the
   annotations above.
3. Each mutating tool changes the visible board without a reload.
4. Every tool rejects bad input with a message that names the field.
5. Unmounting the board or aborting the controller removes every tool.
6. Unit tests cover every tool against fake-indexeddb, and the suite stays green.
7. `docs/webmcp.md` walks from a fresh Chrome to a working Claude Code session with only
   verified versions, names, and commands, or the word "unverified" next to a claim.
