import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TaskDialog } from '../TaskDialog';
import { useTaskStore } from '@/lib/stores/taskStore';

vi.mock('@/lib/stores/taskStore');

// sonner's toast is fired by useAsyncOperation on error; a no-op mock is enough.
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

interface MockStore {
  addTask: ReturnType<typeof vi.fn>;
  updateTask: ReturnType<typeof vi.fn>;
}

describe('TaskDialog (create mode)', () => {
  let store: MockStore;
  let onOpenChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    store = {
      addTask: vi.fn(),
      updateTask: vi.fn(),
    };
    (useTaskStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(store);
    onOpenChange = vi.fn();
  });

  function renderDialog() {
    render(
      <TaskDialog
        mode="create"
        open
        // vi.fn() returns a Mock; cast keeps the test boilerplate light without
        // adding `(open: boolean) => void` annotations on every fn.
        onOpenChange={onOpenChange as unknown as (open: boolean) => void}
        boardId="board-1"
      />
    );
  }

  it('closes the dialog after a successful submit', async () => {
    store.addTask.mockResolvedValue(undefined);
    renderDialog();

    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Buy groceries' } });
    fireEvent.click(screen.getByRole('button', { name: /create task/i }));

    await waitFor(() => {
      expect(store.addTask).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      // The close uses the boolean false — Radix may also call it with `true`
      // during the open transition, so we assert that `false` is among the calls.
      expect(onOpenChange.mock.calls.some(([arg]) => arg === false)).toBe(true);
    });
  });

  it('keeps the dialog open and preserves form data when submit fails', async () => {
    // useAsyncOperation catches this rejection internally; the dialog must
    // observe failure via the sentinel return path, not by re-throw.
    store.addTask.mockRejectedValue(new Error('database is full'));
    renderDialog();

    const titleInput = screen.getByLabelText(/title/i) as HTMLInputElement;
    fireEvent.change(titleInput, { target: { value: 'Important task' } });
    fireEvent.click(screen.getByRole('button', { name: /create task/i }));

    await waitFor(() => {
      expect(store.addTask).toHaveBeenCalledTimes(1);
    });

    // The dialog should NOT have been told to close. Crucially, the form
    // value remains so the user can retry without retyping.
    expect(onOpenChange.mock.calls.some(([arg]) => arg === false)).toBe(false);
    expect(titleInput.value).toBe('Important task');
  });
});
