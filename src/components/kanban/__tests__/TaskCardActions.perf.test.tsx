import { Profiler, type ProfilerOnRenderCallback } from 'react';
import { act, render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TaskCardActions } from '../TaskCardActions';
import { useTaskStore } from '@/lib/stores/taskStore';
import type { Task } from '@/lib/types';

// Uses the REAL taskStore (only the database layer is mocked) so that
// useTaskStore.setState() genuinely notifies subscribers, the same way a
// real store update from an unrelated task edit would. A shallow-mocked
// store can't demonstrate this — the point is whether TaskCardActions
// actually resubscribes/rerenders on state it doesn't use.
vi.mock('@/lib/utils/database', () => ({
  taskDB: {
    init: vi.fn().mockResolvedValue(undefined),
    addTask: vi.fn().mockResolvedValue(undefined),
    updateTask: vi.fn().mockResolvedValue(undefined),
    deleteTask: vi.fn().mockResolvedValue(undefined),
    getTasks: vi.fn().mockResolvedValue([]),
    getBoards: vi.fn().mockResolvedValue([]),
    getSettings: vi.fn().mockResolvedValue(null),
    updateSettings: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../board/BoardNavigationContext', () => ({
  useBoardNavigation: () => undefined,
}));

const now = new Date('2026-01-15T12:00:00.000Z');

const task: Task = {
  id: 'task-1', title: 'Task 1', status: 'todo', boardId: 'board-1',
  priority: 'medium', tags: [], createdAt: now, updatedAt: now,
};

describe('TaskCardActions re-render cost', () => {
  beforeEach(() => {
    useTaskStore.setState({
      tasks: [task],
      filteredTasks: [task],
      filters: { search: '', tags: [], crossBoardSearch: false },
      searchState: { scope: 'current-board', highlightedTaskId: undefined },
      isLoading: false,
      isSearching: false,
      error: null,
      searchCache: new Map(),
    });
  });

  it('does not re-render when an unrelated task-store field changes', async () => {
    const onRender: ProfilerOnRenderCallback = vi.fn();

    render(
      <Profiler id="task-card-actions" onRender={onRender}>
        <TaskCardActions task={task} />
      </Profiler>
    );

    const rendersAfterMount = (onRender as ReturnType<typeof vi.fn>).mock.calls.length;
    expect(rendersAfterMount).toBeGreaterThan(0);

    // Simulates an unrelated task-store update — e.g. another card's edit
    // completing, or a search-state change — that this component's menu
    // (delete/archive/move actions only) has no reason to react to.
    await act(async () => {
      useTaskStore.setState({
        searchState: { scope: 'all-boards', highlightedTaskId: 'some-other-task' },
      });
    });

    expect((onRender as ReturnType<typeof vi.fn>).mock.calls.length).toBe(rendersAfterMount);
  });
});
