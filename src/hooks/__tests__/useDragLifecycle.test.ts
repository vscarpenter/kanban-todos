import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useDragLifecycle } from '../useDragLifecycle';
import type { Task } from '@/lib/types';
import { celebrateTaskCompletion } from '@/lib/utils/celebrateCompletion';

vi.mock('@/lib/utils/celebrateCompletion', () => ({
  celebrateTaskCompletion: vi.fn(),
}));

const mockVibrate = vi.fn();
Object.defineProperty(navigator, 'vibrate', { value: mockVibrate, writable: true });

const todoTask: Task = {
  id: 'task-1',
  title: 'Test Task',
  status: 'todo',
  priority: 'medium',
  tags: [],
  boardId: 'board-1',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

// Minimal @dnd-kit-shaped events — the hook only reads active.id, active.data,
// and over.id.
const startEvent = (id: string) => ({ active: { id } }) as never;
const endEvent = (id: string, overId: string) =>
  ({ active: { id, data: { current: { type: 'task' } } }, over: { id: overId } }) as never;

describe('useDragLifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handleDragStart sets the active task, flags dragging, and fires haptics', () => {
    const { result } = renderHook(() => useDragLifecycle([todoTask], vi.fn().mockResolvedValue(true)));

    act(() => result.current.handleDragStart(startEvent('task-1')));

    expect(result.current.activeTask?.id).toBe('task-1');
    expect(result.current.isDragging).toBe(true);
    expect(mockVibrate).toHaveBeenCalledWith(50);
  });

  it('handleDragEnd clears state and persists the move', async () => {
    const moveTask = vi.fn().mockResolvedValue(true);
    const { result } = renderHook(() => useDragLifecycle([todoTask], moveTask));

    act(() => result.current.handleDragStart(startEvent('task-1')));
    await act(async () => {
      await result.current.handleDragEnd(endEvent('task-1', 'in-progress'));
    });

    expect(result.current.activeTask).toBeNull();
    expect(result.current.isDragging).toBe(false);
    expect(moveTask).toHaveBeenCalledWith('task-1', 'in-progress');
  });

  it('celebrates only when a move into done actually persists', async () => {
    const moveTask = vi.fn().mockResolvedValue(true);
    const { result } = renderHook(() => useDragLifecycle([todoTask], moveTask));

    await act(async () => {
      await result.current.handleDragEnd(endEvent('task-1', 'done'));
    });

    expect(celebrateTaskCompletion).toHaveBeenCalledWith('Test Task');
  });

  it('does not celebrate when the move fails to persist (the #85 fix)', async () => {
    const moveTask = vi.fn().mockResolvedValue(false);
    const { result } = renderHook(() => useDragLifecycle([todoTask], moveTask));

    await act(async () => {
      await result.current.handleDragEnd(endEvent('task-1', 'done'));
    });

    expect(celebrateTaskCompletion).not.toHaveBeenCalled();
  });
});
