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
