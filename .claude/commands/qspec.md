---
description: Generate a Spec-Driven Development spec to tasks/spec.md, including empty test stubs that map to each acceptance criterion.
argument-hint: <feature description>
---

Generate a Spec-Driven Development spec for the following feature: $ARGUMENTS

Write the spec to `tasks/spec.md`. Do not write any implementation code. Do not write filled test bodies. The empty test stubs are the magic. They make the spec executable, not just descriptive.

## Required structure

Use this exact section order:

### 1. Goal

One paragraph. What this feature does and why. No implementation details.

### 2. Inputs and Outputs

A list of every input (user action, API request, file, event) and every output (UI change, persisted data, emitted event, response). Be precise about types and shapes.

### 3. Constraints

Technical constraints, performance budgets, compatibility requirements, security considerations. One bullet per constraint.

### 4. Edge Cases

Failure modes, empty states, race conditions, boundary values. One bullet per case.

### 5. Out of Scope

What this feature explicitly does not do. This list prevents scope creep more than any other section.

### 6. Acceptance Criteria

A numbered list of verifiable behaviors. Each criterion must be testable. Use the format: "Given X, when Y, then Z."

### 7. Test Stubs

For each acceptance criterion in section 6, write an empty test stub that maps to it. Use the project's test framework (check `package.json`, `pyproject.toml`, or equivalent). The body of each stub should contain only a TODO comment referencing the criterion number.

Example for a TypeScript project using Vitest:

```typescript
import { describe, it } from 'vitest';

describe('FeatureName', () => {
  it('AC1: Given a logged-in user, when they submit the form, then a draft is saved', () => {
    // TODO: implement test for acceptance criterion 1
  });

  it('AC2: Given an empty form, when they submit, then validation errors appear', () => {
    // TODO: implement test for acceptance criterion 2
  });
});
```

## Execution rules

1. Read the existing `CLAUDE.md` and `coding-standards.md` first to match project conventions.
2. Check `tasks/lessons.md` for relevant gotchas before drafting.
3. If any section requires assumptions, list them at the top of the spec under "Assumptions".
4. Do not create the test files yet. The stubs go inside the spec document, not in the test directory.
5. After writing the spec, output a one-paragraph summary of what was specified and what would need clarification before implementation.
