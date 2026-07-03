import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ErrorBoundary from '../error';

describe('app error boundary', () => {
  it('renders a recovery fallback instead of a blank screen', () => {
    render(<ErrorBoundary error={new Error('boom')} reset={vi.fn()} />);

    expect(screen.getByRole('heading', { name: /something went wrong/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('calls reset when "Try again" is clicked', () => {
    const reset = vi.fn();
    render(<ErrorBoundary error={new Error('boom')} reset={reset} />);

    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    expect(reset).toHaveBeenCalledTimes(1);
  });

  it('does not leak raw error internals into the fallback UI', () => {
    render(<ErrorBoundary error={new Error('raw internal stack trace detail')} reset={vi.fn()} />);

    expect(screen.queryByText(/raw internal stack trace detail/i)).not.toBeInTheDocument();
  });
});
