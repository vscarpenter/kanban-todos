# Kanban Board Assistant — Eve Agent Design

**Date:** 2026-06-17
**Status:** Approved (pending spec review)

## Summary

A conversational AI assistant for the kanban-todos app, built with the
[Eve](https://eve.dev) framework. The user chats with it (via a web chat UI) to
understand, prioritize, and grow their boards. It operates on an exported board
snapshot and can return import-ready JSON to push changes back into the app.

## Context & constraints

The kanban-todos PWA is deliberately **100% client-side and privacy-first**:
Next.js *static export* to S3 + CloudFront, Zustand + IndexedDB, **no backend**.
Eve agents are the opposite — a long-running Node service that needs a model API
key and sends data to a model provider.

Consequences:

- The agent **cannot live inside the PWA**. It is a separate Node service.
- The integration boundary is the app's existing `ExportData` JSON contract
  (`{ version, exportedAt, tasks[], boards[], settings? }`). The PWA never
  imports agent code; the agent only ever sees a JSON snapshot the user chooses
  to hand it. Data leaves the browser only on a user-initiated export.

## Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Location | New `kanban-agent/` subdirectory in this repo (own npm package) | Isolated from the PWA's static-export build/deploy, but co-located for shared git history and easy type reference. |
| Interface | Web chat UI (`--channel-web-nextjs`) | User wants to "talk to it". Built-in HTTP channel ships regardless. |
| Data flow (v1) | Seeded sample export in the sandbox workspace | Tools work end-to-end immediately; real paste/upload wired up after seeing it run. |
| Model | `anthropic/claude-sonnet-4.6` | Eve's scaffold default; cost-effective and capable for board reasoning. Opus 4.8 is a one-line swap in `agent.ts`. |
| Type sharing | Mirror trimmed types into the agent | A real workspace package is overkill (YAGNI). |

Rejected alternatives for location: a separate sibling repo (loses co-location)
and `eve init .` into the repo root (drops a second Next.js app into a
static-export repo — high risk of tangling builds).

## Architecture

```text
kanban-agent/                      # own npm package, Node 24+
├── package.json
├── README.md                      # how to set ANTHROPIC_API_KEY and run
└── agent/
    ├── agent.ts                   # defineAgent({ model: "anthropic/claude-sonnet-4.6" })
    ├── instructions.md            # assistant identity & behavior
    ├── lib/
    │   └── kanbanTypes.ts         # trimmed Task/Board/ExportData mirror (points to source of truth)
    ├── sandbox/
    │   └── workspace/
    │       └── board.json         # seeded sample export (ExportData shape)
    ├── channels/                  # web-nextjs + built-in eve HTTP (from scaffold)
    └── tools/
        ├── load_board.ts
        ├── summarize_board.ts
        ├── recommend_today.ts
        ├── add_tasks.ts
        ├── update_task.ts
        └── export_board.ts
```

The PWA's source of truth for types is `src/lib/types/index.ts`
(`Task`, `Board`, `TASK_STATUSES`, `TASK_PRIORITIES`) and the `ExportData`
interface in `src/lib/utils/exportImport/serialize.ts`:

```ts
interface ExportData {
  version: string;
  exportedAt: string;
  tasks: SerializedTask[];
  boards: SerializedBoard[];
  settings?: SerializedSettings;
}
```

`kanban-agent/agent/lib/kanbanTypes.ts` mirrors the minimal subset and carries a
comment pointing back to those files.

## Components

### Instructions (`instructions.md`)

The agent is a kanban board assistant. It helps the user understand, prioritize,
and grow their boards. It always works from the currently loaded board. When it
proposes changes it **stages** them in the working copy and only emits
import-ready JSON when the user explicitly asks (via `export_board`). It never
fabricates task IDs or board IDs when mutating existing items.

### Tools

Each tool is one file under `agent/tools/`; the filename is the tool name. All
inputs are validated with Zod (`defineTool` from `eve/tools`).

| Tool | Input | Behavior |
|---|---|---|
| `load_board` | none (v1) | Loads the working board from the seeded sample. Returns a short summary (counts by status, board names). |
| `summarize_board` | optional `boardId` | Counts by status and board, overdue tasks, high-priority tasks, stale tasks (not updated recently). |
| `recommend_today` | optional `limit` | Suggests what to work on, weighing priority + due dates + in-progress WIP + staleness. |
| `add_tasks` | `tasks[]` (title, description?, priority, tags?, status, boardId) | Stages new tasks into the working copy with generated IDs and timestamps. |
| `update_task` | `id` + partial fields (status, priority, dueDate, progress, tags…) | Updates a staged/loaded task in place. |
| `export_board` | optional `includeArchived` | Serializes the working copy to import-ready `ExportData` JSON. |

### Working state

A seeded sample export lives at `agent/sandbox/workspace/board.json`.
`load_board` reads it into a per-session working copy; mutation tools update that
copy; `export_board` serializes it back to `ExportData`.

**Open implementation detail (resolve during planning):** the exact persistence
mechanism for the working copy across tool calls in a session — sandbox file via
`ctx.getSandbox()` vs. session-scoped state. To be locked down while reading
`tools.mdx`, `sandbox.mdx`, and `concepts/context-control.md`.

## Data flow

1. User exports a board from the PWA (or, in v1, the seeded sample is used).
2. `load_board` ingests it into the session working copy.
3. The user chats; read tools (`summarize_board`, `recommend_today`) answer
   questions; write tools (`add_tasks`, `update_task`) stage changes.
4. When satisfied, the user asks for the export; `export_board` returns
   `ExportData` JSON.
5. User re-imports that JSON into the PWA.

## Error handling

- Tools validate input with Zod; invalid input returns a clear error the model
  can relay.
- `load_board` fails gracefully if the sample/JSON is missing or malformed
  (reports the problem rather than throwing).
- `update_task` with an unknown `id` returns an error listing valid IDs.
- `export_board` always produces schema-valid `ExportData` (correct `version`
  and ISO `exportedAt`) so re-import never breaks.

## Testing & verification

- `npx eve info` confirms all six tools are discovered.
- End-to-end session via the web chat:
  1. "summarize my board"
  2. "what should I work on today?"
  3. "add two tasks for releasing v5.3"
  4. "give me the import JSON"
- Confirm the `export_board` output re-imports cleanly into the PWA.

## Out of scope (v1)

- Real paste/upload of board JSON (seeded sample only for now).
- Deployment to Vercel (local `npm run dev` only).
- Writing directly back to the PWA's IndexedDB (the app stays untouched; the
  JSON round-trip is the only integration).
- Slack/Discord channels.
