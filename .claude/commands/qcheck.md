---
description: Skeptical staff-engineer code review of every changed file in this session, against coding-standards.md and CLAUDE.md.
---

Review all changed files in this session as a skeptical staff engineer. Apply the full `coding-standards.md` and `CLAUDE.md` rules. The default posture is "this is not ready to ship until proven otherwise."

## How to work

1. Run `git status` to see what is staged, unstaged, and untracked.
2. Run `git diff` and `git diff --staged` to see the actual changes.
3. Read `CLAUDE.md` for project conventions.
4. Read `coding-standards.md` for the long-form rules.
5. Read `tasks/lessons.md` for project-specific gotchas.
6. For every changed file, evaluate against the checks below.

## What to check

### 1. Standards compliance

- File length under 350 lines (or the project's documented limit).
- Function length under 30 lines (or the project's documented limit).
- Files in the right directories per project structure.
- Imports follow project conventions (path aliases, ordering, no circular deps).

### 2. Type safety

- All function signatures typed. No `any`. No `unknown` without a narrowing block.
- User input validated with `safeParse` or equivalent before use.
- No `as` casts that bypass real validation.

### 3. Test quality

- Every new behavior has a test.
- Tests assert behavior, not implementation.
- No tests that mock the thing they are supposed to test.
- No tests with commented-out assertions, `.skip`, or `.only`.

### 4. Project-specific gotchas

These come from `tasks/lessons.md`. Examples to watch for:

- `bun run test`, not `bun test` (different commands in some setups).
- `safeParse`, not `parse`, on user input.
- `toast.error()`, not `alert()`, for user-facing errors.
- Whatever else lives in this project's `lessons.md`.

### 5. Definition of Done

For every changed file, confirm:

- Tests pass (`bun run test` — not `bun test`, which invokes Bun's own runner instead of Vitest).
- Type check passes (`bun run tsc --noEmit`). There is no `typecheck` script.
- Linter passes (`bun run lint`).
- No new TODO comments without a tracking issue reference.
- No console logs, debug prints, or debugger statements.
- No secrets, API keys, or hardcoded credentials.

### 6. Specialist review

If the diff includes any of the following, invoke the relevant subagent and include its findings:

- React components (`**/*.tsx`): `a11y-reviewer`.

## Output format

Structure the review as follows:

```
## qcheck review

### Files reviewed
- path/to/file1.ts
- path/to/file2.tsx

### Findings

#### Critical (must fix before merge)
- file:line, issue, recommended fix

#### Important (should fix before merge)
- file:line, issue, recommended fix

#### Nits (optional polish)
- file:line, issue, recommended fix

### Definition of Done

- [x] Tests pass
- [x] Type check passes
- [ ] Linter passes (1 error in file2.tsx)
- [x] No new TODOs without tracking
- [x] No debug artifacts
- [x] No leaked secrets

### Specialist review

[output from any auto-invoked subagents]

### Verdict

[Ready to merge / Needs changes / Blocked on X]
```

## Tone

You are a skeptical staff engineer, not a cheerleader. The goal is to find what is wrong, not to congratulate what is right. If a file is genuinely clean, say so in one line and move on. If it is not, be specific. "This is fine" is never an acceptable finding.
