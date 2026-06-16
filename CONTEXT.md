# Kanban Todos

A privacy-first, client-side Kanban todo app. All data lives in the user's browser (IndexedDB); nothing is sent to a server. This file captures the domain language the codebase should speak consistently.

## Language

**Board**:
A column-bearing workspace that owns a set of tasks. One board is the default board and cannot be deleted.
_Avoid_: list, project, workspace

**Task**:
A unit of work belonging to exactly one board, with a status (`todo` / `in-progress` / `done`) and an optional archive flag.
_Avoid_: todo, item, card

**Board ownership**:
A board owns its tasks. Deleting a board **cascades** to its tasks — board and tasks are removed together, atomically, so tasks never outlive their board.

**Orphaned task**:
A task whose `boardId` points at a board that no longer exists. This is always a bug, never a valid state; the cascade in **Board ownership** exists to prevent it.

**Cascade**:
The removal of a board together with every task it owns, in a single IndexedDB transaction. Either both go or neither does.

## Example dialogue

> **Dev:** When someone deletes a board, what happens to the tasks on it?
> **Domain expert:** They go too. A board *owns* its tasks — deleting the board cascades to them.
> **Dev:** So a task could never sit around pointing at a board that's gone?
> **Domain expert:** Right. That'd be an *orphaned task*, and that's a bug. The cascade is one atomic step precisely so it can't happen.
