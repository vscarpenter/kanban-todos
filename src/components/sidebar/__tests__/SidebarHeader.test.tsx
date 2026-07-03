import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SidebarHeader } from '@/components/sidebar/SidebarHeader';

describe('SidebarHeader', () => {
  it('renders the Cascade wordmark and logo', () => {
    render(<SidebarHeader onToggle={vi.fn()} />);

    expect(screen.getByText('Cascade')).toBeInTheDocument();
    // Logo renders an <svg role="img" aria-label="Cascade">
    expect(screen.getByRole('img', { name: 'Cascade' })).toBeInTheDocument();
  });

  it('renders a collapse button labeled for assistive tech', () => {
    render(<SidebarHeader onToggle={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Collapse sidebar' })).toBeInTheDocument();
  });

  it('calls onToggle exactly once when the collapse button is clicked', () => {
    const onToggle = vi.fn();
    render(<SidebarHeader onToggle={onToggle} />);

    fireEvent.click(screen.getByRole('button', { name: 'Collapse sidebar' }));

    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
