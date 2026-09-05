# WebMCP tool layer

**Started:** 2026-09-05
**Spec:** `docs/superpowers/specs/2026-09-05-webmcp-tool-layer-design.md`
**Branch:** `feat/webmcp-tools`

## Phase 1: tool layer

- [x] Design spec approved (task naming, eight tools, sidebar indicator)
- [x] refactor(stores): `addTask` and `updateTask` return the resulting Task
- [x] feat(webmcp): types, detect, status store, register/unregister with one AbortController
- [x] feat(webmcp): board tools (`cascade_list_boards`, `cascade_get_board`)
- [x] feat(webmcp): task read tools (`cascade_list_tasks`, `cascade_get_task`)
- [x] feat(webmcp): task write tools (create, update, move, delete)
- [x] feat(webmcp): register at boot from KanbanBoard, abort on cleanup
- [x] feat(ui): agent tools indicator in the sidebar footer
- [x] docs: ADR-0006, CLAUDE.md and OpenWiki pointers (ADR committed; pointers pending the docs commit)

## Phase 2: bridge to Claude Code

- [x] Verify tools in Chrome 152 at localhost:3000 (8 tools, create/move/delete reflected on the board); cascade.vinny.dev pending deploy
- [ ] `claude mcp add --transport stdio webmcp-server -- npx webmcp-server`, smoke test from Claude Code
- [ ] docs/webmcp.md with verified versions, flag name, extension, commands, fallback bridge

## Phase 3: tests

- [x] Unit tests per tool against fake-indexeddb (written first, per tool group)
- [x] Opt-in Playwright smoke test (`WEBMCP_E2E=1`, chrome channel, `--enable-features=WebMCP`): 3 passed
- [ ] Manual checklist in docs/webmcp.md
- [ ] Version bump, final suite run, summary

## Assumptions

- Inputs and outputs use camelCase to match the Task and Board field names.
- `cascade_create_task` with a non-todo status adds as todo, then moves, so status rules apply.
- Production builds strip console output (`removeConsole`); the "API absent" info line shows in development only. Flagged for Vinny.
- No push and no PR until Vinny says so.

## Resuming From Here

Phase 1 is complete and committed on `feat/webmcp-tools`. Phase 2 blocker found and fixed:
npx-based MCP servers fail from this project because npm rejects the nested `overrides` keys in
package.json (Claude Code runs servers with the project as cwd). The bridge is installed
globally with bun instead. Next: docs/webmcp.md, local bridge test once the extension is
activated on the localhost tab, then the cascade.vinny.dev pass after deploy.

---

## Older backlog (from the 2026-03-28 standards review)

- [ ] Add tests for untested critical paths (`conflictResolution`, `resetApp`, `keyboard`)
- [ ] Replace non-null assertions with proper guards
- [ ] Split remaining oversized files (`validation.ts`, `boardStore.ts`, `ExportDialog.tsx`, `taskStore.filters.ts`)
- [ ] Add production error tracking recommendation
- [ ] Create missing documentation guides
- [ ] Extract magic numbers to named constants
