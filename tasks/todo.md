# Resuming From Here (2026-10-02)

**Done**
- PR #112 `fix/auto-archive`: `autoArchiveCompletedTasks(days)` in the task store, run by `KanbanBoard` after the stores load and when the setting changes (fa2bdfa). Never option stored as `autoArchiveDays = 0`, schema range 0 to 365, version 5.4.0 (53a3458). Suite 771 passed.
- PR #113 `docs/ste-guide` (base `fix/auto-archive`): `docs/cascade-ste-guide.html`, the Cascade System Manual in ASD-STE100, updated for Never and 5.4.0. Mechanical check: 528 sentences, longest 16 words (procedural) and 21 (descriptive), no flagged words. Private Artifact: https://claude.ai/artifact/9rJSSdZ7bzoccv47s188B1

**Next**
- Merge #112 first, then retarget #113 to `main` (rebase it if #112 is squash-merged).
- Manually check Settings > Never > Save > reload; the Radix Select has no automated test.
- Deploy 5.4.0 after merge.

**Assumptions**
- Default stays at 30 days, so the first load after deploy archives done tasks older than 30 days (restorable).
- Auto-archive measures from `completedAt`, falling back to `updatedAt` for older data.
- It runs at load and on setting change only; a tab left open for days does not re-run it.

---

# Auto-archive fix

**Started:** 2026-10-02
**Branch:** `fix/auto-archive`
**Tier:** Standard (task store action, board wiring, tests; no new public contract)

The `autoArchiveDays` setting (default 30, range 1 to 365) was saved and validated, but no code read it.

- [x] Failing tests: `autoArchiveCompletedTasks(days)` archives done tasks whose `completedAt` (or `updatedAt` when `completedAt` is missing) is at least `days` old; leaves newer, unfinished, and already-archived tasks alone; one bulk DB write; returns the count; re-throws on DB failure
- [x] Store action in `taskStore.crudActions.ts`, wired in `taskStore.ts`
- [x] `KanbanBoard` runs it after the stores initialize and when the setting changes; toast with the count
- [x] Full suite (768 passed), lint, typecheck; commit

Assumption (parked on the dashboard): no "Never" option. Existing done tasks older than the setting move to the Archive at the next load; Restore brings them back.

---

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

- [x] Verify tools in Chrome 152 at localhost:3000 and at cascade.vinny.dev (v5.3.0 deployed 2026-09-05): 8 tools, create/move/delete reflected on the board, through the bridge on both
- [x] Bridge registered at user scope by absolute path (global bun install); stdio smoke test against localhost passed: list, create, move, delete, error path
- [x] docs/webmcp.md with verified versions, flag name, extension, commands, fallback bridge

## Phase 3: tests

- [x] Unit tests per tool against fake-indexeddb (written first, per tool group)
- [x] Opt-in Playwright smoke test (`WEBMCP_E2E=1`, chrome channel, `--enable-features=WebMCP`): 3 passed
- [x] Manual checklist in docs/webmcp.md (run once on localhost, 2026-09-05)
- [x] Version bump to 5.3.0, final suite run (754 unit, 3 e2e), summary

## Assumptions

- Inputs and outputs use camelCase to match the Task and Board field names.
- `cascade_create_task` with a non-todo status adds as todo, then moves, so status rules apply.
- Production builds strip console output (`removeConsole`); the "API absent" info line shows in development only. Flagged for Vinny.
- No push and no PR until Vinny says so.

## Resuming From Here

Fixed 2026-09-05: prod v5.3.0 froze the page after "Update Task" because the local
`node_modules` (which `scripts/deploy.sh` builds from) held four orphaned copies of Radix's
dismissable layer; see `tasks/lessons.md`. Done: regression test
(`src/components/__tests__/RadixLayerStack.test.tsx`), deploy.sh reinstalls from the lockfile
with `--force` on every deploy, local tree rebuilt, version 5.3.1. Next: deploy 5.3.1 to
cascade.vinny.dev (`bun run deploy`) and re-check the edit flow there. Still open from the WebMCP
work: an origin trial token so production needs no flag.

---

## Older backlog (from the 2026-03-28 standards review)

- [ ] Add tests for untested critical paths (`conflictResolution`, `resetApp`, `keyboard`)
- [ ] Replace non-null assertions with proper guards
- [ ] Split remaining oversized files (`validation.ts`, `boardStore.ts`, `ExportDialog.tsx`, `taskStore.filters.ts`)
- [ ] Add production error tracking recommendation
- [ ] Create missing documentation guides
- [ ] Extract magic numbers to named constants
