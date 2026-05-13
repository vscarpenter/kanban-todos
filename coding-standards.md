# Code Standards & Agentic Guidance v15.0

**Purpose.** Directives governing how LLMs approach complex, multi-step development tasks. Optimized for Claude Opus 4.7 and the Claude Code harness. Every directive applies to every coding session.

**How to use this file.** This is the full reference. Load only what's needed at runtime. Enforce mechanical rules with hooks, not prose.

| Location | Contents |
|---|---|
| Global `~/.claude/CLAUDE.md` | Universal behavioral defaults, voice, top-level rules. |
| Project `CLAUDE.md` | Stack, file structure, naming conventions, project-specific gotchas. |
| Skill `.claude/skills/coding-standards/SKILL.md` | This full reference, loaded on demand. |

---

## Part 0: Opus 4.7 Tuning

Opus 4.7 changes defaults that older standards did not need to address. These tunings apply across every session.

### Effort calibration

Opus 4.7 respects effort levels strictly, especially at the low end. At `low` and `medium` it scopes work to exactly what was asked. It does not silently extend.

- **Default for coding and agentic work:** `xhigh`.
- **Minimum for intelligence-sensitive work:** `high`.
- **Cost or latency tradeoff:** drop to `medium` and accept narrower scoping.
- **Avoid `low`** for non-trivial tasks. Risk of under-thinking is real.

Pair `xhigh` with a generous `max_tokens` (start at 64k) so the model has room to think and act across subagents.

### Adaptive thinking

Extended thinking with `budget_tokens` is deprecated. Use `thinking: {type: "adaptive"}` with the effort parameter as the lever. Adaptive thinking outperforms manual budgets in evaluations.

### Literal instruction following

Opus 4.7 interprets prompts more literally than 4.6. It will not generalize an instruction from one item to another. It will not infer requests you did not make.

**Rule:** State scope explicitly. Say "apply this to every section, not just the first one." If you want above-and-beyond behavior, ask for it directly. Default behavior is to do exactly what was asked.

### Overeagerness and overengineering

Opus 4.7 still tends to overengineer if not constrained. Counter it with explicit minimalism:

- **Scope:** Do not add features, refactor, or improve beyond what was asked. A bug fix does not need surrounding code cleaned up.
- **Documentation:** Do not add docstrings, comments, or type annotations to code you did not change.
- **Defensive coding:** Do not add error handling for scenarios that cannot happen. Trust internal code and framework guarantees. Validate at system boundaries only.
- **Abstractions:** Do not create helpers for one-time operations. Do not design for hypothetical futures.

### Subagent calibration

Opus 4.7 has strong native orchestration but spawns fewer subagents than 4.6 by default. Steer it explicitly:

- **Spawn** when fanning out across items or reading multiple files in parallel.
- **Do not spawn** for work completable in a single response, such as refactoring a function already in view.
- **Skip subagents** for tasks under 3 tool calls. Overhead exceeds benefit.

---

## Part 1: Agentic Behavior

### Codebase Orientation (REQUIRED before first write)

1. Read README, CLAUDE.md, and CONTRIBUTING docs first.
2. Explore the directory structure. Understand the project layout.
3. Identify existing patterns: naming, module organization, error handling, test structure.
4. Check for existing utilities before creating new ones.
5. Match existing code style exactly, even if it differs from these standards.

**Investigate before answering.** Never speculate about code you have not opened. If the user references a specific file, read it before answering. Make no claims about a codebase before investigating.

**Resumed sessions:** Read CLAUDE.md, then `tasks/lessons.md`, then `tasks/todo.md`, then check git log (last 3 to 5 commits). Do not ask the user to re-explain context captured in these files.

**Rule:** The existing codebase is the primary style guide. These standards apply to greenfield code or explicit refactoring.

### Spec-Driven Development (REQUIRED for non-trivial tasks)

1. Write the spec first. Create `tasks/spec.md` before any implementation begins.
2. Define the contract: inputs, outputs, constraints, edge cases, and what success looks like.
3. State anti-goals explicitly. What this does NOT do. Prevents scope creep.
4. Get approval. Do not start coding until the spec is reviewed and confirmed.
5. Treat drift as a failure. Update the spec first and get re-confirmation before continuing.

**Spec template fields:**

| Field | Content |
|---|---|
| Goal | One sentence: what this does and why. |
| Inputs / Outputs | What goes in, what comes out, what format. |
| Constraints | Performance, security, compatibility, size requirements. |
| Edge Cases | Empty inputs, nulls, concurrent calls, failure modes. |
| Out of Scope | Explicit list of what this version does not handle. |
| Acceptance Criteria | Checkable statements that prove correctness. |
| Test Stubs | Draft test function names (empty bodies) mapping to each criterion. Shipped with the spec. |

**Rule:** Code without a spec is a guess. A spec written after the code is a rationalization. Write it first.

### Handling Ambiguity

- **Ask before assuming.** If a requirement has multiple valid interpretations, ask which is intended.
- **State your assumptions.** If proceeding without clarification, list every assumption explicitly.
- **Prefer reversible choices.** When guessing, choose the option easiest to change later.
- **Flag scope questions early.** Confirm scope before modifying shared code, external APIs, or infrastructure.

### Stop Conditions

Halt and re-establish context when any of these are true:

- A plan breaks. Do not push through ambiguity by guessing forward.
- Context budget hits 80% with major uncommitted work. Commit, then continue.
- You cannot write a failing test first. You do not yet understand the requirement.
- Verification surfaces a result you cannot explain. Diagnose root cause before patching.
- A required clarification is missing. Ask before building on a guess.

### Tool Efficiency

Claude executes tool calls in parallel by default. Reserve sequential execution for true dependencies (output of A feeds input of B). For everything else, fire concurrently. Never use placeholders or guess missing parameters.

- Use `grep` or `ripgrep` to search across files instead of reading them individually.
- Use `git log`, `git diff`, and `git status` directly rather than asking Claude to summarize manually.
- For bulk refactors, use `sed` or `awk` on multiple files in one pass.
- Set explicit timeouts upfront for long-running bash operations.
- **Clean up temporary files.** If you create scratchpads, helper scripts, or iteration files, remove them before declaring the task complete.

### Hard-to-Reverse Action Safety

Local, reversible actions are encouraged without confirmation: editing files, running tests, creating branches, local commits.

**Confirm before proceeding** on actions that are hard to reverse, affect shared systems, or are destructive:

- **Destructive:** `rm -rf`, dropping tables, deleting branches, force-deleting files.
- **Hard to reverse:** `git push --force`, `git reset --hard`, amending published commits.
- **Externally visible:** pushing code, commenting on PRs or issues, sending messages, modifying shared infrastructure.

**Never bypass safety checks** with shortcuts like `--no-verify`. Do not discard unfamiliar files. They may be in-progress work.

### Context Management & Sustained Work

1. Outline the implementation plan with milestones and acceptance criteria for each.
2. Work systematically through each milestone. Commit functional changes frequently.
3. Commit at least every significant component or logical unit of work.
4. Monitor context usage. Prioritize committing working code before context exhaustion.
5. Never leave significant work uncommitted.

**Prefer fresh context over compaction.** State lives in `tasks/`. Resume by reading those files, not by summarizing chat history. Opus 4.7 is effective at discovering state from the local filesystem. Lean on that.

**Outcomes, not process.** Every multi-step task must have a stated "done" condition the model can recognize autonomously.

- ❌ Process-defined: "Keep checking the logs until you find the error."
- ✓ Outcome-defined: "Check the last 100 lines of logs. If you find an error, explain root cause and propose one fix. If none found, say so and stop."

### Session Handoff Protocol (REQUIRED before ending)

1. Commit all working code. Do not leave meaningful work uncommitted.
2. Update `tasks/todo.md` with "Resuming From Here": completed, next steps, blockers, assumptions made.
3. Note assumptions made during the session that future work depends on.
4. Run the test suite. Do not end with failing tests.

**Rule:** A clean handoff is as important as clean code. If another session cannot resume without a briefing, the handoff failed.

### Self-Improvement Loop

After any correction from the user, capture the pattern in `tasks/lessons.md` immediately. End every correction session with: *"Update CLAUDE.md so this mistake does not recur."*

| File | Purpose |
|---|---|
| `tasks/lessons.md` | Project-specific learnings: patterns, gotchas, context that matters for this codebase. |
| `CLAUDE.md` | Persistent behavioral rules that apply across sessions and projects. |

**Rule:** Corrections are learning contracts. Every mistake that recurs after being corrected once is a process failure, not a knowledge gap.

### Verification

Verification has two phases. Define the method before writing code. Run the checks before declaring complete.

**Before implementation:**

1. Define the verification method and match it to the domain.
2. Backend: test suite. API: curl or integration tests. Frontend: browser, screenshot, accessibility. Data: row-count diffs. Infra: terraform plan, smoke tests.
3. Confirm the loop is fast and runnable autonomously. Building a fast feedback loop is higher priority than the feature.

**Verification surfaces in this environment:** Playwright MCP for UI, GitHub MCP for repo state, aws-core MCP for cloud, Biome for format and lint, project test runner for behavior.

**Before presenting code or marking complete:**

1. Re-read every changed file. Check for typos, leftover debug statements, TODO comments.
2. Verify all imports are used and no dead code remains.
3. Confirm naming is consistent across the changeset.
4. Check that error paths are handled, not just the happy path.
5. Ensure the code compiles, runs, and tests pass.
6. Run the elegance check below.
7. Ask: "Would a staff engineer approve this?" If uncertain, keep improving.

**Elegance check (required for non-trivial changes).** Verify all four:

- Fewer branches than the previous implementation, or branches justified by edge cases.
- No new dependencies unless removing two or more lines of code per dependency added.
- Diff is the smallest set of changes that implements the spec.
- A junior engineer can read it without flipping to another file.

**Rule:** Code without a verification method is a guess. Never present code you have not re-read. A 30-second review catches the majority of avoidable mistakes.

### Incremental Progress

- Get a minimal working version first, then extend.
- Avoid writing large amounts of code before testing any of it.
- Run the full test suite after every file modification.
- Do not assume code is correct without execution.
- Each increment is one red/green/refactor cycle (see Part 3). No second function before the first has a passing test.

---

## Part 2: Code Quality Standards

### Core Principles

1. **Simplicity over cleverness.** Prefer clarity to novelty.
2. **Build small, iterate fast.** Deliver working code before optimizing.
3. **Code for humans.** Readable by a junior engineer without scrolling to other files. (Enforced by the elegance check in Part 1.)
4. **Prefer boring tech.** Stability over hype.
5. **Automate consistency.** Enforce linting, tests, and formatting in CI and hooks, not prose.
6. **Standard lib over external.** Use stdlib unless an external dep cuts more than 2x the code.
7. **Solve generally, not for tests.** Implement the actual logic. Do not hard-code values or write code that only passes the test cases. Tests verify correctness; they do not define the solution.

### Naming & Clarity

- Descriptive names. Avoid `data`, `temp`, single letters.
- Functions ≤ 40 lines with single responsibility.
- Maximum 3 levels of nesting. Use early returns.
- Comments explain WHY, not WHAT.
- Document public APIs with usage examples.
- Limit code files to roughly 350 to 400 lines. Split by responsibility.

### Type Safety & Static Analysis

- Type annotations on ALL function signatures (parameters and return types).
- Strict compiler settings (TypeScript `strict`, Python `mypy strict`).
- Typed data structures (interfaces, typed dicts) over untyped maps.
- Run static analysis and type checking as part of the verification workflow.
- Never use `any`, `object`, or escape hatches without a justification comment.

### Structure & Abstraction

- Apply DRY only after 2+ repetitions.
- YAGNI: do not build for hypothetical futures.
- Composition over inheritance.
- Duplicate if it is clearer than abstracting.
- No magic numbers. Use named constants.
- Inject dependencies (I/O, time, randomness).

### Dependency Management

- Pin versions in lockfiles. No floating ranges in production.
- Run `npm audit` or `pip-audit` every CI build. Fail on high-severity findings.
- Add new dependencies deliberately. Evaluate maintenance, license, bundle size.
- Remove unused dependencies promptly.
- Document why non-obvious dependencies exist.

**AI supply-chain risk:** When Claude Code installs dependencies during agentic sessions, treat those changes with the same scrutiny as any other code change. Run audits in PostToolUse hooks, not just in CI.

**Rule:** Claude Code can install packages autonomously. Every package it adds is your team's responsibility. Review first, accept second.

---

## Part 3: Testing & Error Handling

### Red/Green/Refactor (canonical home, NOT OPTIONAL)

| Step | Action |
|---|---|
| 1. RED | Write a test that describes the desired behavior. Run it. Confirm it fails for the right reason, not a syntax error or missing import. |
| 2. GREEN | Write the minimal implementation that makes the test pass. No more, no less. |
| 3. REFACTOR | Extract duplication, improve naming, simplify logic without breaking the test. |
| 4. REPEAT | Each new behavior gets its own cycle before moving on. |

**Rule:** If you cannot write a failing test first, you do not yet understand the requirement well enough to implement it. Stop and clarify.

### Test Quality

- Coverage target: roughly 80% line coverage as a floor. **100% coverage of all acceptance criteria from the spec.**
- Test naming: behavior-based. `should_return_404_when_user_not_found`, not `test_get_user`.
- Arrange-Act-Assert. One assertion concept per test. Include positive AND negative cases.
- Independent tests. No shared mutable state. Mock external deps at the boundary.
- Unit tests under 100ms each. Move slow tests to integration suites.
- Test behavior, not implementation. Tests should survive internal refactors.

### Error Handling

- Fail fast with clear messages.
- Never swallow exceptions.
- Typed or custom errors for domain-specific failures (not-found ≠ unauthorized ≠ validation-failed).
- Log with context, no secrets.
- Retry transient failures with exponential backoff. Circuit breakers for dependencies.
- Return meaningful error responses: status code, error type, human-readable message.

---

## Part 4: Security

- Validate and sanitize all user inputs.
- Use parameterized queries. No SQL concatenation.
- Apply least-privilege principles.
- Never commit secrets. Rotate regularly.
- Keep dependencies patched and scanned. See Dependency Management in Part 2.

---

## Part 5: Git Workflow

### Commit Standards

```
<type>(<scope>): <description>

[optional body, what and why, not how]

[optional footer, BREAKING CHANGE: / Closes #42]
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`, `build`

Subject line: imperative mood, lowercase, no period, max 72 characters. Standard workflow: **commit → push → create PR.**

Branch naming: `<type>/<short-description>`, for example `feat/oauth-login` or `fix/null-payment-response`.

### Code Review Standards

**PR size:** ≤ 400 lines of non-generated code, single logical concern. Split larger PRs.

**PR description must include:** what and why, how to test locally, screenshots for UI changes, deferred follow-up linked to ticket.

**Reviewer checks:** spec match, edge cases and error paths, security or perf or observability regressions, readability, meaningful tests, tests written before implementation (check commit order), dependencies justified.

Respond to review requests within one business day. Use `nit:` or `suggestion:` prefix for non-blocking comments. Approve only when you would be comfortable owning this code if the author left tomorrow.

---

## Part 6: Architecture & Decisions

### Architecture Decision Records (ADRs)

Required when a decision is hard to reverse, affects multiple teams or services, or future engineers will wonder why it was made.

**Location:** `docs/adr/NNNN-short-title.md`

| Field | Content |
|---|---|
| Date | YYYY-MM-DD |
| Status | Proposed \| Accepted \| Deprecated \| Superseded by [NNNN] |
| Deciders | Names or team |
| Context | What situation or problem prompted this decision? |
| Decision | What was decided? State it directly. |
| Consequences | What becomes easier? Harder? Out of scope? |
| Alternatives | What else was evaluated and why was it rejected? |

**Rule:** If you are explaining an architectural choice in a Slack thread or PR comment, that explanation belongs in an ADR instead.

---

## Part 7: Task Management

### Workflow

1. **Plan first.** Write your plan to `tasks/todo.md` with checkable items before touching any code. For non-trivial work, write `tasks/spec.md` first (see Part 1).
2. **Verify plan.** Check in with the user before starting implementation.
3. **Track progress.** Mark items complete as you go. Never batch-mark at the end.
4. **Explain changes.** High-level summary at each significant step.
5. **Document results.** Add a review section to `tasks/todo.md` when the task is complete.
6. **Capture lessons.** Update `tasks/lessons.md` after any correction or unexpected outcome.

### Definition of Done (ALL must be true)

**Correctness & Quality**

- [ ] Implementation matches the spec or ticket acceptance criteria.
- [ ] Verification method was defined before coding and passes autonomously.
- [ ] Tests were written BEFORE implementation (red confirmed before green).
- [ ] Each acceptance criterion has at least one corresponding passing test.
- [ ] Refactor step was completed after green (no dead code, no over-fit logic).
- [ ] All new and existing tests pass. Suite runs after every modification.
- [ ] Linting, formatting, and type checking pass with no suppressions.

**Documentation & Process**

- [ ] PR description is complete and reviewable without a verbal walkthrough.
- [ ] New environment variables or config are documented.
- [ ] ADR written if an architectural decision was made.
- [ ] New dependencies audited and locked in the lockfile.
- [ ] Feature flags named, owned, and have a removal date.
- [ ] Accessibility baseline met (if frontend work).

**Rule:** "It works on my machine" is not done. This checklist is done.

> Self-review items (debug statements, dead code, naming, error handling, staff engineer approval) are enforced in Part 1's Verification section. They are not duplicated here.

---

## Part 8: Prompt Engineering Standards

### Prompt Structure

| Element | Purpose |
|---|---|
| Role / Context | Tell the model who it is and what it knows. |
| Task | State the goal clearly. One prompt, one goal. |
| Constraints | What must be true about the output? |
| Anti-goals | What should the output NOT do or include? |
| Output Format | Specify the expected shape of the response. |

### Prompt Patterns

These prompts are the canonical source for the slash commands in Part 9. Edit them here when changing canonical wording.

**Spec Prompt** (used by `/qspec`)
```
You are a [role]. I need a spec for [feature].
Context: [relevant background]
Constraints: [non-negotiables]
Anti-goals: [what this should not do]
Output: spec.md with Goal, Inputs/Outputs, Constraints,
Edge Cases, Acceptance Criteria, Test Stubs.
```

**Implementation Prompt** (used by `/tdd`)
```
Implement [feature] per this spec: [paste spec]
Use [language/framework]. Follow existing patterns in [file].
Do not modify [out-of-scope files].
Follow red/green/refactor: write the failing test first,
confirm it fails, then write minimal implementation to pass.
Solve the problem generally. Do not hard-code to the test cases.
Return only the implementation with inline comments on
non-obvious decisions.
```

**Review Prompt** (used by `/qcheck`)
```
Review this code as a skeptical staff engineer.
Report every issue you find, including low-confidence and low-severity findings.
Do not filter or self-censor. A separate verification step will rank them.
Tag each finding as BLOCKING, IMPORTANT, or NIT, with confidence and severity.
Categories to cover: security, missing error handling,
test gaps, readability, logic implemented before tests,
hard-coded values that should be parameterized.
Do not rewrite the code. Return a structured list of findings.
```

**Debug Prompt**
```
This test is failing: [paste test and output]
Here is the relevant implementation: [paste code]
Diagnose the root cause. Do not guess.
Propose one fix with an explanation.
```

**Architecture Prompt**
```
Before writing any code, analyze [problem area] and identify:
  1. Three implementation approaches with tradeoffs.
  2. Risks and edge cases for each.
  3. Your recommended approach and why.
Confirm before proceeding with implementation.
```

### Prompt Anti-Patterns

- **Vague goals:** "Make this better" without specifying what better means.
- **Missing constraints:** Prompts with no constraints invite over-engineering.
- **No anti-goals:** Without them, the model expands scope by default.
- **Stacked goals:** One prompt asking for spec, implementation, tests, and docs simultaneously.
- **Implicit context:** Assuming the model knows your project structure or prior decisions.
- **Implicit scope:** Opus 4.7 is literal. State scope explicitly. "Apply this to every section" beats "Apply this."
- **Conversational framing on operational tasks:** "Could you please help me understand..." Write direct commands instead.
- **No exit conditions:** "Keep checking until you find the issue" loops indefinitely. Define outcomes.
- **Implicit "above and beyond":** If you want a fully-featured implementation, say so explicitly. Default behavior is to do exactly what was asked.
- **Severity self-censorship in reviews:** "Be conservative" or "only flag high-severity" causes the model to investigate fully but report less. Ask for all findings, tagged by severity.
- **Skipping TDD in the prompt:** Not specifying red/green/refactor invites code-first, tests-after.

**Rule:** A prompt is a spec for the model. Apply the same rigor you would to a spec for code.

---

## Part 9: Claude Code Primitives

Reusable building blocks: slash commands, skills, subagents, and hooks. If you do something more than once a day, it should be one of these, not a prompt you retype.

### Slash Commands (`.claude/commands/`)

Short, repeatable actions checked into git. Executable with a single invocation. Can inline Bash for pre-computed context.

| Command | Source Prompt | Purpose |
|---|---|---|
| `/qspec` | Spec Prompt (Part 8) | Generate a spec. |
| `/tdd` | Implementation Prompt (Part 8) | Start a red/green/refactor cycle. |
| `/qcheck` | Review Prompt (Part 8) | Skeptical staff engineer review. |

Other examples: commit-push-PR, run tests, format code, generate changelog.

### Skills (`.claude/skills/`)

Complex multi-step workflows with domain knowledge or conditional logic. SKILL.md describes when to fire and what to do. Progressive disclosure: skills are folders with `references/`, `scripts/`, `examples/` subdirectories.

*Examples:* analytics queries, incident response, migration playbooks.

**Skill design rules:**

- Skill description is a trigger, not a summary. Write it for the model: "when should I fire?"
- Don't state the obvious. Focus on what pushes Claude out of default behavior.
- Don't railroad with prescriptive step-by-step instructions. Give goals and constraints.
- Include scripts and libraries so Claude composes rather than reconstructs boilerplate.
- Build a Gotchas section in every skill. Add Claude's failure points over time.

### Subagents (`.claude/agents/`)

See Part 0 for when to spawn or skip subagents. When you do constrain behavior:

- Subagents return concise summaries, not raw output.
- Read-only tools for research subagents. Write access only for implementation subagents.
- Set `isolation: worktree` on agents that modify files.
- Use `model: haiku` for read-only analysis. `sonnet` or `opus` for architecture reasoning.

**Standard agent files:** `build-validator`, `code-simplifier`, `security-reviewer`, `tdd-enforcer`, `verify-app`.

### Hooks

Hooks enforce mechanically what prose enforces by hope. Every rule moved to a hook is one fewer instruction competing for attention in the context window.

```
PostToolUse (auto-format):    npx biome format --write $CLAUDE_FILE_PATH || true
PostToolUse (audit deps):     npm audit --audit-level=high || exit 1
PostCompact (re-inject):      cat tasks/todo.md tasks/lessons.md
Stop (verification gate):     npm test && npx tsc --noEmit || exit 1
```

**Rule:** If a standard can be enforced by a hook, it should be. Human discipline is a backup, not the primary mechanism.

---

## Part 10: Red Flags Index

Use this as a runtime checklist. Each item points to the section where the rule is defined.

**Code shape**

| Red flag | Reference |
|---|---|
| Functions exceeding 40 lines | Part 2: Naming & Clarity |
| More than 3 nesting levels | Part 2: Naming & Clarity |
| Files exceeding 400 lines | Part 2: Naming & Clarity |
| Unused abstractions or commented-out code | Part 1: Verification |
| Copy-pasted logic (3+ times) | Part 2: Structure & Abstraction |
| Hard-coded test values, magic numbers | Part 2: Core Principles #7 |

**Process**

| Red flag | Reference |
|---|---|
| Writing code before reading existing patterns | Part 1: Codebase Orientation |
| Implementing without a spec on non-trivial work | Part 1: Spec-Driven Development |
| No verification method defined before implementation | Part 1: Verification |
| Trial-and-error fixes without root cause analysis | Part 1: Stop Conditions |
| Pushing through a broken plan instead of re-planning | Part 1: Stop Conditions |
| Modifying files outside the task's scope | Part 1: Handling Ambiguity |
| Ending a session with failing tests or uncommitted changes | Part 1: Session Handoff |
| Large uncommitted changes late in context | Part 1: Context Management |
| Speculating about code without opening it | Part 1: Codebase Orientation |
| Hard-to-reverse actions without confirmation | Part 1: Hard-to-Reverse Action Safety |
| Temporary scratchpad files left behind | Part 1: Tool Efficiency |

**Testing & TDD**

| Red flag | Reference |
|---|---|
| Implementation written before tests | Part 3: Red/Green/Refactor |
| Refactor step skipped after reaching green | Part 3: Red/Green/Refactor |
| Failing test committed without implementation | Part 3: Red/Green/Refactor |
| Acceptance criteria not reflected in any test case | Part 7: Definition of Done |

**Quality & types**

| Red flag | Reference |
|---|---|
| TODOs without ticket links | Part 2: Naming & Clarity |
| Missing type annotations on public interfaces | Part 2: Type Safety |
| Untyped `any` or `object` without justification | Part 2: Type Safety |
| `console.log` or `print` statements in production | Part 1: Verification |
| Catching and ignoring exceptions silently | Part 3: Error Handling |

**Process & infra**

| Red flag | Reference |
|---|---|
| Architectural decisions explained in Slack instead of an ADR | Part 6: ADRs |
| Feature flags with no owner, date, or removal plan | Part 7: Definition of Done |
| Floating dependency versions in production lockfiles | Part 2: Dependency Management |
| New dependencies added without review | Part 2: Dependency Management |
| PR exceeding 400 lines across unrelated concerns | Part 5: Code Review |
| Frontend interactive elements not keyboard-accessible | Part 7: Definition of Done |

**Workflow & discipline**

| Red flag | Reference |
|---|---|
| Ad-hoc subagent prompts for repeated patterns | Part 9: Subagents |
| Standards enforced by discipline when a hook could automate | Part 9: Hooks |
| Over-engineering beyond what was asked | Part 0: Overeagerness |

---

> "Code should be safe to modify, easy to reason about, and boring to maintain. When in doubt, simplify."
>
> Vinny Carpenter, Document Version 15.0
