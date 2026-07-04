# Cascade domain migration + codebase audit remediation

**Date:** 2026-07-03
**Status:** Approved
**Source:** `docs/codebase-analysis-report.html` (comprehensive 12-dimension audit, generated same day)

## Goal

1. Make `cascade.vinny.dev` the sole primary deployment target; remove all `todos.vinny.dev` references from code, config, scripts, and docs.
2. Fix every Critical, High, and Medium finding from the audit report (45 findings total). Low findings are explicitly out of scope.

## Constraints

- Follow `coding-standards.md`: TDD (red/green/refactor) for behavior changes, ≤40-line functions, ≤3 nesting levels, no new `any`/magic numbers, commit at each logical unit.
- Don't touch live AWS infrastructure (S3 buckets, CloudFront distributions, DNS) — this session changes code/config/docs only. Actual decommissioning of `todos.vinny.dev` infra is a manual follow-up for the repo owner.
- Don't push or open a PR without a separate check-in once implementation is complete — commit locally per phase.
- Findings are referenced by the ID scheme from the audit report (e.g. `ERR-1`, `PERF-2`, `DOC-6`); this doc defines *how* and *in what order* to fix them, not what each one is — full diagnosis, evidence, and file:line citations live in the report.

## Phase 0 — Domain migration

Remove `todos.vinny.dev` from: `deploy-config.json` (drop the `todos` environment, set `default_environment: "cascade"`), `package.json` (collapse `deploy:cascade`→`deploy`, `deploy:check:cascade`→`deploy:check`, `invalidate:cascade`→`invalidate`; drop `deploy:todos`/`invalidate:todos`; fix `deploy:s3` to target the cascade bucket), `scripts/deploy.sh` (default env vars → cascade bucket/CloudFront ID), `scripts/deploy-multi.sh` (usage-text examples only — it's already data-driven off `deploy-config.json`), `docker/security-headers.conf` (comment), `docs/security-headers-baseline.json` (`domains` array), `CLAUDE.md` (deployment section).

This closes **STD-1** with no application code change — `layout.tsx`'s Cascade branding was already correct; the bug was `deploy-config.json` misidentifying `todos` as primary.

## Phase 1 — Critical (6)

- `ERR-1` + `ERR-2` together (adjacent code, one commit): re-throw after `setError` in `boardStore.ts`/`taskStore.crudActions.ts`; add a top-level error boundary (`app/global-error.tsx` or `app/error.tsx`).
- `TEST-1`: add an E2E job to `.github/workflows/ci.yml`.
- `TEST-2`: fix or delete the vacuous test in `KanbanBoard.test.tsx`.
- `DOC-1` + `DOC-2`: rewrite (not delete) `docs/api-reference.md`, `docs/developer-guide.md`, `docs/testing-guide.md` to match the real type model, real files, and real dependencies.

## Phase 2 — High (13, since STD-1 moves to Phase 0)

`STD-2` (delete dead validators), `TEST-3` (E2E storage isolation), `TEST-4` (shared E2E fixtures/helpers), `SEC-1`+`SEC-2` (`bun update` for the 2 High CVEs), `ARCH-1` (settingsStore bypass + diverged defaults), `PERF-1`+`PERF-2` (N+1 IndexedDB transactions on import and board reorder), `ERR-3` (surface boardStore/settingsStore error state), `DOC-3` (npm→bun), `DOC-4` (keyboard shortcuts), `DOC-5` (dead doc links), `DOC-6` (Docker README port).

## Phase 3 — Medium (25)

`ERR-4` (redact PII from logs), `ERR-5` (IndexedDB `onblocked` handler), `TEST-5` (investigate settings-management.spec.ts failures), `TEST-6` (document coverage ratchet plan), `TEST-7` (sidebar unit tests), `TEST-8` (column selector fragility), `SEC-3` (CI audit gate), `SEC-4` (js-yaml update), `SEC-5` (no action — already an accepted, documented tradeoff; verify the note is current), `ARCH-2` (migration scaffold), `ARCH-3` (import version check), `ARCH-4` (delete dead debounce code), `PERF-3` (Zustand selectors on hot components), `PERF-4` (memoize BoardView filtering), `PERF-5` (skip unused board lookup), `PERF-6` (fix dnd-kit lazy-load docs — accept eager-load status quo rather than the Large real fix), `PERF-7` (remove stale memoryOptimization.ts doc reference), `STD-4` (refactor `conflictResolution.ts`), `STD-5` (reuse serialize helpers), `STD-6` (justify or remove `conflictMerge.ts` casts), `DOC-7` (remove stale `archive/` reference), `DOC-8` (fix version string mismatch), `DOC-9` (update REFACTORING-V3.md), `DOC-10` (fix ADR dates).

## Out of scope

All 21 Low findings. Live AWS infrastructure changes. Pushing/opening PRs (separate check-in after implementation).

## Execution approach

Work phases sequentially, commit locally after each phase (or sub-unit within a phase where a phase is large). TDD for behavior-changing fixes; direct edits with test-suite verification for mechanical/doc fixes. Run `bun run test` and relevant E2E specs after each phase before moving on.
