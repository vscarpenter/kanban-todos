# Coding Standards

This file defines the prescriptive rules for AI-assisted development on this project. It is the long-form companion to `CLAUDE.md`. Skills, subagents, and slash commands reference it on demand.

A fully-populated reference version lives at `examples/coding-standards.md` (about 750 lines). This template is the skeleton. Add your project's real rules under each section, with the *reason* behind each rule.

The reason matters. "Use parameterized queries" without "to prevent SQL injection because of this attack pattern" produces a parrot. Include the why and you produce a thinker.

---

## Part 1: Agentic behavior

Rules governing how Claude operates inside the codebase.

### 1.1 Read before writing

Before editing any file, read it in full. Read its tests if they exist. Read any file it imports that affects behavior.

**Why:** Edits made without context are the most common source of regressions. The cost of reading is one tool call. The cost of a regression is hours.

### 1.2 Plan before executing

For any task that touches more than two files or requires more than three tool calls, write a plan first. The plan goes in `tasks/todo.md` under "Resuming From Here." Confirm the plan before executing.

**Why:** Multi-step tasks without an explicit plan tend to drift. The plan acts as a contract.

### 1.3 No silent compromises

If a rule from this document conflicts with the current task, surface the conflict. Do not silently relax the rule. The human decides.

**Why:** Silent compromises compound. Surfaced conflicts get resolved or documented as intentional exceptions.

---

## Part 2: Code quality

### 2.1 File size

Source files stay under 350 lines. When a file approaches the limit, look for a logical split.

**Why:** Files over 350 lines tend to violate single-responsibility. They also exceed the comfortable working set for review.

### 2.2 Function size

Functions stay under 30 lines. Functions that exceed the limit are usually doing more than one thing.

**Why:** Long functions are harder to test, harder to read, and harder to reuse.

### 2.3 Type safety

All function signatures are typed. No `any`. No `unknown` without a narrowing block immediately after.

**Why:** `any` and untyped signatures defeat the type checker exactly where bugs cluster (boundaries between systems).

### 2.4 No dead code

Delete unused imports, unused variables, unused functions, and commented-out code. The version control system remembers; the source file should not.

**Why:** Dead code accumulates. It pretends to be live code in greps and reviews.

### 2.5 Accessibility (WCAG AA)

For React components: semantic HTML, keyboard accessibility, form labels, image alt text, no color-only state, modal focus management, focus visibility, heading order, valid ARIA, live regions for async updates.

The `a11y-reviewer` subagent enforces this baseline.

---

## Part 3: Testing

### 3.1 Tests assert behavior, not implementation

Test what the code does, not how it does it. A refactor that preserves behavior should not require test changes.

**Why:** Tests coupled to implementation prevent the refactors that keep code clean.

### 3.2 No mocks where fakes will do

Prefer fakes (real implementations with controlled state) over mocks (stubs that return canned values) when the boundary is structural.

**Why:** Mocks pass when the system breaks at the boundary. A real lesson from this project: a Dexie test suite passed entirely while the first real migration corrupted user data because the mocks did not model index behavior.

### 3.3 One assertion focus per test

A test asserts one behavior. Multiple expectations are fine if they describe the same behavior.

**Why:** When a test fails, the failure should tell you exactly what broke.

### 3.4 No `.skip`, `.only`, or commented-out assertions in committed code

`.only` blocks the rest of the suite. `.skip` accumulates. Commented-out assertions are pretend tests.

---

## Part 4: Security

### 4.1 Validate all user input

Use `safeParse` (or your project's equivalent). Handle the error case explicitly. Never `parse`.

**Why:** `parse` throws on invalid input. Thrown errors at the boundary become 500s in production.

### 4.2 No secrets in code

API keys, tokens, credentials, and connection strings live in environment variables. Never in committed files. Never in committed config.

**Why:** Once a secret hits git history, it is leaked. Rotation is the only fix.

### 4.3 Parameterized queries

All database queries use parameterized statements or an ORM. No string interpolation into SQL.

**Why:** SQL injection is still the most common web vulnerability. Parameterization eliminates the entire class.

### 4.4 No `eval`, no `Function()`, no `dangerouslySetInnerHTML` without sanitization

These are escape hatches from the type and security models. Use them only with explicit justification in a code comment.

---

## Part 5: Git workflow

### 5.1 Conventional commits

`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`, `perf:`. Subject under 72 characters. Body explains why, not what.

### 5.2 One logical change per commit

If a commit message needs "and," it is probably two commits.

### 5.3 No `git push --force` on shared branches

Use `--force-with-lease` if you must rewrite history. Better: do not rewrite history on shared branches.

### 5.4 PRs include the spec or issue link

The PR description references the `tasks/spec.md` for the feature, or the issue it closes. Reviewers should not have to reverse-engineer intent from the diff.

---

## Part 6: Architecture decision records (ADRs)

For decisions that are hard to reverse, write an ADR.

### 6.1 What goes in an ADR

- The decision.
- The context (what was happening when the decision was made).
- The alternatives considered.
- The consequences (what becomes easier and harder).

### 6.2 Where ADRs live

`docs/adr/NNNN-short-title.md`, numbered sequentially.

### 6.3 ADRs are append-only

You do not edit an old ADR to reflect a new decision. You write a new ADR that supersedes it.

---

## Part 7: Task management

### 7.1 `tasks/spec.md` for active features

Generated by `/qspec`. Contains goal, inputs and outputs, constraints, edge cases, out of scope, acceptance criteria, and empty test stubs.

### 7.2 `tasks/todo.md` for in-flight work

Updated continuously. Has a "Resuming From Here" section so a fresh session can pick up without re-explaining context.

### 7.3 `tasks/lessons.md` for project-specific gotchas

Reviewed at the start of every session (referenced from `CLAUDE.md`). When something bites you twice, it goes here.

---

## Part 8: Prompt engineering

### 8.1 Standards before specifics

Reference `coding-standards.md` and `CLAUDE.md` at the top of any prompt that touches the codebase. Without them, Claude infers conventions and drifts.

### 8.2 Specs over instructions

Prefer "build this spec" over "implement this feature." Specs are testable and reviewable. Instructions are conversational.

### 8.3 Subagents for specialist domains

When a task has hard, non-obvious constraints, push it to a specialist subagent. Subagents have one job and a focused prompt.

---

## Part 9: Reusable skills

When a workflow is reused across projects, promote it to a skill.

### 9.1 Skill anatomy

A `SKILL.md` with frontmatter (name, description), supporting files, and an explicit triggers list.

### 9.2 Skill discovery

Claude reads available skills at session start. The description determines whether the skill is invoked. Write descriptions that match how you would search for the skill, not how you would describe it.

---

## Part 10: Red flags (quick reference)

If you see any of these in a diff, slow down.

- A test that calls only mocks.
- A function over 30 lines.
- A new top-level directory.
- An import from a path that does not exist yet.
- A `parse` on user input.
- A `console.log` in committed code.
- An `any` type.
- A migration without `CONCURRENTLY` on an index.
- A `NOT NULL` column added without a default.
- A `.skip` or `.only` in a test file.
- A secret value in source.
- A `git push --force` on a shared branch.
- An ADR being edited rather than superseded.
- A `CLAUDE.md` over 250 lines.
- A `coding-standards.md` rule without a reason.

---

## When to update this document

- A new pattern that the team agreed on.
- A new gotcha that is high-frequency enough to belong here rather than in `tasks/lessons.md`.
- A new external dependency that comes with its own rules.

Treat updates as engineering work. PRs, not notepad edits.
