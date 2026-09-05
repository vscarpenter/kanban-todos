# WebMCP tool layer

**Started:** 2026-09-05
**Spec:** `docs/superpowers/specs/2026-09-05-webmcp-tool-layer-design.md`
**Branch:** `feat/webmcp-tools`

## Phase 1: tool layer

- [x] Design spec approved (task naming, eight tools, sidebar indicator)
- [ ] refactor(stores): `addTask` and `updateTask` return the resulting Task
- [ ] feat(webmcp): types, detect, status store, register/unregister with one AbortController
- [ ] feat(webmcp): board tools (`cascade_list_boards`, `cascade_get_board`)
- [ ] feat(webmcp): task read tools (`cascade_list_tasks`, `cascade_get_task`)
- [ ] feat(webmcp): task write tools (create, update, move, delete)
- [ ] feat(webmcp): register at boot from KanbanBoard, abort on cleanup
- [ ] feat(ui): agent tools indicator in the sidebar footer
- [ ] docs: ADR-0006, CLAUDE.md and OpenWiki pointers

## Phase 2: bridge to Claude Code

- [ ] Verify tools in Chrome 152 at localhost:3000 and at cascade.vinny.dev
- [ ] `claude mcp add --transport stdio webmcp-server -- npx webmcp-server`, smoke test from Claude Code
- [ ] docs/webmcp.md with verified versions, flag name, extension, commands, fallback bridge

## Phase 3: tests

- [ ] Unit tests per tool against fake-indexeddb (written first, per tool group)
- [ ] Opt-in Playwright smoke test (`WEBMCP_E2E=1`, chrome channel, `--enable-features=WebMCP`)
- [ ] Manual checklist in docs/webmcp.md
- [ ] Version bump, final suite run, summary

## Assumptions

- Inputs and outputs use camelCase to match the Task and Board field names.
- `cascade_create_task` with a non-todo status adds as todo, then moves, so status rules apply.
- Production builds strip console output (`removeConsole`); the "API absent" info line shows in development only. Flagged for Vinny.
- No push and no PR until Vinny says so.

## Resuming From Here

Design approved. Next step: the refactor commit, test first.

---

## Older backlog (from the 2026-03-28 standards review)

- [ ] Add tests for untested critical paths (`conflictResolution`, `resetApp`, `keyboard`)
- [ ] Replace non-null assertions with proper guards
- [ ] Split remaining oversized files (`validation.ts`, `boardStore.ts`, `ExportDialog.tsx`, `taskStore.filters.ts`)
- [ ] Add production error tracking recommendation
- [ ] Create missing documentation guides
- [ ] Extract magic numbers to named constants
