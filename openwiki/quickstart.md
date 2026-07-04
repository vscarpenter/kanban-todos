# Cascade — OpenWiki Quickstart

Cascade is a **privacy-first kanban task manager** (package name `kanban-todos`). It runs
**entirely in the browser** — no accounts, no servers, no tracking. All data lives locally in
IndexedDB, and the app ships as a **static export** (built with Next.js, served by nginx or any
static host / CDN).

- **What it does:** Multiple kanban boards, drag-and-drop tasks across `Todo → In Progress → Done`,
  tagging, priorities, due dates, search/filter (including cross-board), archiving, JSON
  export/import with conflict resolution, and installable PWA behavior.
- **Who it's for:** End users wanting a fast local task board; developers extending a client-only
  React app with a modular Zustand + IndexedDB architecture.

Live/primary deployment: `cascade.vinny.dev` (S3 + CloudFront). See
[testing & operations](testing-and-operations.md).

## Tech stack

| Area | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, **static export** / `output: export`) |
| UI | React 19, Tailwind CSS v4, shadcn/ui (Radix), Lucide icons |
| Drag & drop | `@dnd-kit` |
| State | Zustand (three modular stores) |
| Persistence | IndexedDB via a custom `TaskDatabase` class |
| Theming | `next-themes` (light/dark/system) |
| Package manager | **Bun** (`bun@1.3.5`, pinned; project is bun-only) |
| Tests | Vitest + Testing Library (jsdom) for unit; Playwright for E2E |

Source of truth for the stack: `package.json`, `next.config.ts`, `README.md`, `CLAUDE.md`.

## Run it

Prerequisites: [Bun](https://bun.sh) 1.3+.

```bash
bun install
bun run dev      # http://localhost:3000
bun run build    # clean + static export to ./out
bun run start    # serve production build
bun run lint     # eslint src/
bun run test     # vitest run
bun run test:e2e # playwright
```

The app is client-only at runtime: the board tree renders inside a `ClientOnly` boundary and
IndexedDB is only touched in the browser (see `src/components/KanbanBoard.tsx`,
`src/lib/utils/database.ts`).

## Repository map

```
src/
├── app/            # Next.js App Router: layout.tsx (providers + metadata), page.tsx (board),
│                   # error.tsx, and static routes: /about, /install, /privacy
├── components/     # React components (dialogs, sidebar, kanban, search, ui/ = shadcn)
├── hooks/          # useDragLifecycle, useImportState, useSearchState
├── lib/
│   ├── stores/     # Zustand stores (task/board/settings), split into focused modules
│   ├── types/      # index.ts — single source of truth for Task/Board/Settings + enums
│   ├── utils/      # database, security, validation, export/import, conflict resolution,
│   │               # notifications, keyboard, iosDetection, boardHelpers, etc.
│   ├── hooks/      # store-facing hooks (e.g. useStoreErrorToasts)
│   ├── icons.ts    # centralized Lucide icon exports
│   └── utils.ts    # cn() helper
└── test/           # Vitest global setup (setup.ts)
e2e/                # Playwright specs + fixtures + SPEC.md
docs/               # Pre-existing human docs (user guide, dev guide, API reference, etc.)
```

## Where to go next

| Topic | Page |
| --- | --- |
| Runtime architecture, provider tree, rendering & data flow | [architecture.md](architecture.md) |
| Zustand stores + IndexedDB schema and persistence | [state-and-data.md](state-and-data.md) |
| Data model & business rules (statuses, progress, auto-archive, security limits) | [domain.md](domain.md) |
| Feature workflows: import/export, conflict resolution, share, reset, keyboard, PWA | [workflows.md](workflows.md) |
| Tests, linting, deployment, Docker | [testing-and-operations.md](testing-and-operations.md) |

## Existing documentation

The repo already ships a rich `docs/` tree. Prefer it for end-user detail; this OpenWiki focuses
on architecture and change-oriented guidance for contributors and agents.

- `docs/getting-started.md`, `docs/installation-guide.md`, `docs/user-guide.md` — user-facing.
- `docs/developer-guide.md`, `docs/api-reference.md` — developer detail (may lag current code).
- `docs/testing-guide.md`, `docs/REFACTORING-V3.md` — testing and the v3 store refactor.
- `docs/adr/`, `docs/agents/`, `docs/superpowers/` — decision records and agent notes.
- Root `CLAUDE.md`, `coding-standards.md`, `AGENTS.md` — contributor conventions.

> Note: some `docs/` and README claims (version numbers, "7 modules", PWA/perf specifics) can
> drift from the code. When docs and source disagree, trust the source files this wiki cites.
