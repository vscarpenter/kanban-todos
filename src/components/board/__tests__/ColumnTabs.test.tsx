import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ColumnTabs } from '../ColumnTabs';

describe('ColumnTabs', () => {
  function renderTabs(active: 'todo' | 'in-progress' | 'done' = 'todo') {
    const onColumnChange = vi.fn();
    render(
      <ColumnTabs
        activeColumn={active}
        onColumnChange={onColumnChange}
        todoCount={3}
        inProgressCount={1}
        doneCount={5}
      />
    );
    return { onColumnChange };
  }

  it('renders all three column tabs with their counts', () => {
    renderTabs();

    expect(screen.getByRole('button', { name: /to do/i })).toHaveTextContent('(3)');
    expect(screen.getByRole('button', { name: /in progress/i })).toHaveTextContent('(1)');
    expect(screen.getByRole('button', { name: /done/i })).toHaveTextContent('(5)');
  });

  it('marks the active tab with aria-pressed=true and others with false', () => {
    renderTabs('in-progress');

    expect(screen.getByRole('button', { name: /to do/i })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: /in progress/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /done/i })).toHaveAttribute('aria-pressed', 'false');
  });

  it('invokes onColumnChange with the column id when a tab is clicked', () => {
    const { onColumnChange } = renderTabs();

    fireEvent.click(screen.getByRole('button', { name: /done/i }));

    expect(onColumnChange).toHaveBeenCalledTimes(1);
    expect(onColumnChange).toHaveBeenCalledWith('done');
  });
});
