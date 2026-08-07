---
description: Run a strict red, green, refactor cycle. Writes a failing test first, pauses for approval, then writes the minimum implementation. Auto-invokes specialist subagents based on files touched.
argument-hint: <behavior description>
---

Run a strict red, green, refactor cycle for the following behavior: $ARGUMENTS

## The cycle

### Phase 1: Red

1. Read the relevant `tasks/spec.md` if one exists for this feature. If no spec exists, ask whether to create one with `/qspec` first.
2. Read `CLAUDE.md`, `coding-standards.md`, and `tasks/lessons.md` for relevant context and gotchas.
3. Write a single failing test that covers the behavior. One test, not many. The test must:
   - Reference the specific acceptance criterion or behavior under test in a comment.
   - Use the project's test framework and conventions.
   - Fail for the right reason (the behavior does not exist yet), not for setup or compilation reasons.
4. Run the test. Confirm it fails. Capture the failure output.
5. **Stop.** Output the test code and the failure output. Wait for explicit approval before proceeding to Phase 2.

### Phase 2: Green

Only proceed if approval was given.

1. Write the minimum implementation that makes the test pass. No extra features. No defensive code beyond what the test requires.
2. Run the test. Confirm it passes.
3. Run the full test suite. Confirm nothing else broke.
4. Output the implementation and the test results.

### Phase 3: Refactor

1. Look for duplication, unclear naming, or violations of the project's coding standards.
2. Refactor without changing behavior. Run the tests after each refactor step to confirm nothing breaks.
3. If the refactor would touch protected areas (see auto-invoke rules below), invoke the relevant specialist subagent before committing.

## Auto-invoke rules

Before completing Phase 3, check the changed files. If any of these patterns match, invoke the corresponding specialist subagent and address its findings:

- Files matching `**/*.tsx` or component files: invoke `a11y-reviewer`.

The subagent runs read-only. You decide whether to act on its findings before completing the cycle.

## Discipline rules

- **Do not skip Phase 1.** The red step is the most commonly skipped and the most valuable. It proves the test is real and the behavior is genuinely missing.
- **One test per cycle.** If the behavior needs multiple tests, run the cycle multiple times.
- **Do not write implementation code in Phase 1.** Even tempting "while I'm here" changes belong in a separate cycle.
- **Run the full suite in Phase 2.** A passing new test is not enough. Confirm nothing else broke.

## Output format

At the end of each phase, output a clearly labeled section header:

```
## Phase 1: Red

[test code]

[test failure output]

Awaiting approval to proceed to Phase 2.
```

Wait for approval after Phase 1. Phases 2 and 3 can run together if the implementation is straightforward and no refactor is needed.
