# Coding Standards Compliance Review — Action Plan

**Date:** 2026-03-28
**Review Scope:** Full codebase audit against coding-standards.md (v10.0)
**Baseline:** Build passes, 361/361 tests green, TypeScript strict mode enabled, 56 lint warnings

---

## Executive Dashboard

| Area | Grade | Key Metric |
|------|-------|------------|
| Tooling Baseline | A | Build passes, 361/361 tests green, TS strict |
| Code Quality | B- | 6 files over size limit, nesting issues, DRY violations |
| Type Safety | A- | No `any` usage, strict mode on, 4 blocking issues |
| Testing | B | Good patterns where tested, but only 13.5% file coverage |
| Security | A | No critical vulns, strong sanitization, no secrets |
| Accessibility | B- | Good ARIA foundation, keyboard gaps, color-only indicators |
| Project Structure | B | Excellent docs & git workflow, missing CI/tasks/ADRs |

---

## Tier 1 — Blocking (Fix Now)

- [x] Create `tasks/todo.md` and `tasks/lessons.md`
- [x] Fix empty catch blocks in `PwaUpdater.tsx` (swallowed exceptions)
- [x] Add keyboard handlers to clickable divs in `CrossBoardGroups.tsx`
- [x] Add CI workflows for lint + test + type-check + build

## Tier 2 — High (Next Sprint)

- [x] Split oversized files: `SettingsDialog.tsx` (438→262 lines, extracted SettingsSections.tsx)
- [x] Extract DRY merge logic in `conflictResolution.ts` (generic mergeEntities utility)
- [ ] Add tests for untested critical paths (`conflictResolution`, `resetApp`, `keyboard`)
- [x] Fix color-only accessibility indicators (priority, column status)
- [x] Create `.env.example` with documented variables
- [ ] Replace 55 non-null assertions with proper guards
- [ ] Split remaining oversized files: `validation.ts`, `boardStore.ts`, `ExportDialog.tsx`, `taskStore.filters.ts`

## Tier 3 — Medium (Backlog)

- [ ] Add `docs/adr/` directory with initial decision records
- [x] Fix `aria-expanded` and form validation accessibility (SearchFilterPopover)
- [ ] Add production error tracking recommendation
- [x] Update Unicode support in security allowlists
- [x] Memoize `BoardStats` filtering
- [ ] Create missing documentation guides
- [ ] Either integrate `AccessibleInput` across forms or remove it
- [ ] Extract magic numbers to named constants
- [x] Remove dead code (commented-out useState in AccessibleInput.tsx)
- [x] Fix deprecated `.substr()` in `resetApp.ts`
- [x] Replace Math.random with crypto.randomUUID in ariaHelpers.ts

---

## Detailed Findings by Area

### Code Quality (Standards Part 2)

#### Files Over 350-400 Lines
| File | Lines | Action |
|------|-------|--------|
| `src/lib/utils/validation.ts` | 482 | Split by validation domain |
| `src/components/SettingsDialog.tsx` | 438 | Extract sub-components |
| `src/lib/stores/boardStore.ts` | 415 | Follow taskStore modular pattern |
| `src/components/ExportDialog.tsx` | 397 | Extract export logic to utility |
| `src/lib/stores/taskStore.filters.ts` | 382 | Split filter categories |
| `src/lib/utils/conflictResolution.ts` | 371 | Extract generic merge function |

#### Function Length & Nesting
- `ExportDialog.tsx:101-157` — `handleExport()` is 56 lines with nested try-catch-finally
- `taskStore.filters.ts:65-110` — `applyFiltersToTasks()` is 45 lines with nested filters
- `conflictResolution.ts:81-112` — Merge functions have 4-5 levels of nesting, identical patterns x3 (DRY violation)
- `SettingsDialog.tsx:170-438` — JSX tree reaches 5+ nesting levels

#### Other Code Quality
- Dead code: Commented-out `useState` in `AccessibleInput.tsx:48`
- Magic numbers: `date-time-picker.tsx` has `"09:00"` (3x), `42` without named constants
- Console statements: 52 `console.error/warn` calls (removed in prod via `removeConsole`)
- TODOs: Clean — none found

### Type Safety & Error Handling (Standards Parts 2 & 3)

#### Blocking
- `PwaUpdater.tsx:78` — Empty `catch {}` swallows service worker errors
- `PwaUpdater.tsx:50,61` — Bare `.catch(() => {})` silently ignores SW update failures
- `BoardView.tsx:162` — Non-null assertion `currentBoardId!` without inline guard

#### Suggestions
- Store actions lack explicit return type annotations on implementations
- Error messages lose stack traces (only `error.message` preserved)
- `database.ts:18` — `request.error` could be null

### Testing (Standards Part 3)

#### Coverage: 13.5% file coverage (17/126 files)
- Well-tested: Stores (~85%), utilities (~70%), security (~90%)
- Untested critical: `conflictResolution.ts`, `resetApp.ts`, `keyboard.ts`, `boardHelpers.ts`, `fileHandling.ts`
- 70+ components with zero test coverage

#### Test Quality Issues
- Mock state pollution in `SearchBar.test.tsx`
- Copy-pasted test data in store tests (should use factories)
- Component tests over-mock internal stores
- Positive/negative case ratio: 70/20/10 (target: 60/30/10)

### Security (Standards Part 4)

#### No Critical Vulnerabilities
- Strong: No `dangerouslySetInnerHTML`, no `eval()`, no hardcoded secrets
- Strong: Comprehensive `security.ts` sanitization, `crypto.randomUUID()` for IDs

#### Medium Issues
- `security.ts:23-28` — ASCII-only character allowlist blocks Unicode input
- `versionManagement.ts:153-156` — localStorage merge without key whitelist
- `resetApp.ts:34-40` — Cookie deletion with unsanitized hostname
- `ariaHelpers.ts:26` — `Math.random()` for IDs (inconsistent with crypto usage elsewhere)

#### Low Issues
- `resetApp.ts:36` — Deprecated `.substr()` → use `.slice()`
- `fileHandling.ts` — Extension-only file validation (MIME checked elsewhere)

### Accessibility (Standards Part 2 — A11y Baseline)

#### High Priority
- `CrossBoardGroups.tsx:51-62` — Clickable divs with NO keyboard handler or focus indicators
- `TaskCard.tsx:14-17` — Priority uses color only (no text alternative)
- `DragDropProvider.tsx:52-84` — No aria-live announcement on drag-drop complete

#### Medium Priority
- `SearchFilterPopover.tsx:38` — `aria-expanded` hardcoded to `"false"`
- `KanbanColumn.tsx:66-69` — Column status by color only
- `BoardStats.tsx:44-52` — Decorative dots missing `aria-hidden="true"`
- `TaskDialog.tsx` — No `aria-invalid` on form fields
- `AccessibleInput.tsx` — Exists but unused across entire codebase
- `BoardStats.tsx:17-28` — Task filtering not memoized

### Project Structure (Standards Parts 5-7)

#### Excellent
- Conventional commits consistently used
- Comprehensive documentation (8 guides)
- Well-organized directory structure

#### Missing Infrastructure
- `tasks/todo.md` and `tasks/lessons.md` — Created as part of this review
- `docs/adr/` — No architectural decision records
- `.env.example` — No centralized env var documentation
- CI workflows — No lint/test/build automation on PRs
- Missing docs: Performance, accessibility, troubleshooting, contributing guides
- No production error tracking (Sentry/Rollbar)

---

## Resuming From Here

**Completed (2026-03-28):**
- All Tier 1 blocking fixes implemented
- Tier 2: DRY merge refactor, SettingsDialog split, color-only a11y, .env.example
- Tier 3: Dead code, deprecated APIs, aria-expanded, Unicode patterns, memoization, crypto IDs
- Build passes, 361/361 tests green, 0 lint errors (56 warnings remain — non-null assertions)

**Remaining work:**
- Add tests for untested critical paths (conflictResolution, resetApp, keyboard)
- Replace 55 non-null assertions with proper guards
- Split remaining oversized files (validation.ts, boardStore.ts, ExportDialog.tsx, taskStore.filters.ts)
- Add docs/adr/ directory
- Add production error tracking
- Create missing documentation guides
- Extract magic numbers to named constants

**Blockers:** None.
