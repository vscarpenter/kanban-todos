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

### Observation: npx-based MCP servers fail from this repository
- Claude Code starts stdio servers with the project directory as cwd, and npm rejects the nested
  `overrides` keys in package.json ("Override without name: eslint-plugin-import/minimatch")
- Affects context7, ui-craft, and the WebMCP bridge alike; a global install by absolute path works
- **Rule:** Register machine-level MCP servers by absolute binary path, or fix the overrides format.

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
