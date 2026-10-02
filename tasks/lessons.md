# Lessons Learned

**Project:** kanban-todos
**Started:** 2026-03-28

---

## Coding Standards Review — 2026-03-28

### Observation: Non-null assertions are the dominant lint issue
- 55 of 56 lint warnings are `@typescript-eslint/no-non-null-assertion`
- Each `!` is a potential runtime crash bypassing TypeScript's null safety
- **Rule:** Prefer optional chaining, nullish coalescing, or explicit guards over `!`

### Observation: AccessibleInput built but never integrated
- `src/components/accessibility/AccessibleInput.tsx` exists with full ARIA support
- Zero components in the codebase actually use it
- **Rule:** Don't build infrastructure without a plan to integrate it. Either adopt or remove.

### Observation: conflictResolution.ts has a clear DRY violation
- `mergeBoards()`, `mergeTasks()`, `mergeSettings()` are nearly identical
- Same merge-and-track-conflicts pattern repeated 3 times
- **Rule:** When you see 3+ repetitions, extract to a generic utility

### Observation: Empty catch blocks hide critical failures
- `PwaUpdater.tsx` has `catch {}` and `.catch(() => {})` patterns
- Service worker update failures are completely invisible
- **Rule:** Never swallow exceptions. At minimum, log the error.

### Observation: CI pipeline only runs Claude reviews, not quality gates
- No lint, test, type-check, or build verification on PRs
- Quality enforcement depends entirely on developer discipline
- **Rule:** If a standard can be enforced by automation, it must be.

## WebMCP tool layer, 2026-09-05

### Observation: npx-based MCP servers failed from this repository
- Claude Code starts stdio servers with the project directory as cwd, and npm rejected the
  yarn-style `parent/child` keys in `overrides` ("Override without name"), then the `^` specs on
  `@types/react` that disagreed with their pinned overrides (EOVERRIDE)
- Fixed by writing overrides in npm's nested object form and pinning those two direct specs;
  bun reads both forms the same way (the lockfile was already in the nested form)
- **Rule:** Keep `overrides` in npm's nested form, and keep a direct dependency's spec identical to
  its override. Test with `npx` from the repo root, not from home.

### Observation: the WebMCP Bridge extension forgets "Until reload" activations
- Tab activations live in the service worker's memory; Chrome stops the worker about 30 seconds
  after the bridge connection drops, and the activation is gone with no visible sign
- **Rule:** Document "Always on" as the only mode, and keep the server running while activating.

### Observation: Chrome 152 diverges from the WebMCP draft in three places
- `executeTool` takes a JSON string; rejected handlers surface as a generic UnknownError; and
  `consequentialHint` is accepted but dropped from `getTools()`
- **Rule:** Verify the API in the installed browser before writing tests or docs; the draft moves.

### Observation: real-store tests need two setup lines the global mock hides
- `src/test/setup.ts` mocks the database module and pins `crypto.randomUUID` to one value
- **Rule:** Tests against the real TaskDatabase call `vi.unmock('@/lib/utils/database')`, import
  `fake-indexeddb/auto`, and restore real UUIDs (see `src/lib/webmcp/__tests__/realStores.ts`).

## Frozen page after "Update Task", 2026-09-05

### Observation: `bun install` leaves orphaned nested copies behind after version bumps
- v5.3.0 shipped four copies of `@radix-ui/react-dismissable-layer` (plus nested focus-scope,
  presence and portal) even though `bun.lock` resolves each to one version. Incremental installs
  during the dependency bump nested them, later bumps hoisted the final version, and
  `bun install` then reported "no changes" without removing the leftovers
- Radix keeps its layer and focus stacks in module scope, so the card menu and the Edit Task
  dialog used different stacks: the dialog's copy recorded `pointer-events: none` as the value
  to restore, and closing it froze the page until reload
- A fresh install (`bun install --frozen-lockfile --force`, or into an empty directory) yields one
  copy; `scripts/deploy.sh` now does that on every deploy
- **Rule:** After any dependency bump, check for nested copies before building or deploying:
  `find node_modules -maxdepth 6 -path "*/node_modules/@radix-ui/*/node_modules/@radix-ui/*"`.
  `src/components/__tests__/RadixLayerStack.test.tsx` fails when the menu and dialog stop sharing
  a stack, so keep it in the suite.

## Auto-archive fix and STE guide, 2026-10-02

### Observation: a setting shipped with no code that read it
- `autoArchiveDays` was saved, validated, exported, and merged on import, but nothing archived
  tasks; CLAUDE.md and docs still claimed "automatic archiving"
- Found only because documenting the app forced a check of each claim against the code
- **Rule:** When a setting is added, add the test that proves its consumer runs. When documenting
  a feature, grep for the code that reads the value, not just where it is stored.
