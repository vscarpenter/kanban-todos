import { act, render, screen } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { WebMcpIndicator } from '@/components/WebMcpIndicator';
import { useWebMcpStatusStore } from '@/lib/webmcp/status';

describe('WebMcpIndicator', () => {
  afterEach(() => {
    useWebMcpStatusStore.getState().reset();
  });

  it('reads "off" before anything is registered', () => {
    render(<WebMcpIndicator />);

    expect(screen.getByRole('status')).toHaveTextContent('Agent tools off');
  });

  it('reads "on" and says how many tools are registered', () => {
    useWebMcpStatusStore.getState().setStatus('registered', 8);

    render(<WebMcpIndicator />);

    const indicator = screen.getByRole('status');
    expect(indicator).toHaveTextContent('Agent tools on');
    expect(indicator).toHaveAttribute('title', expect.stringContaining('8'));
  });

  it('explains that the browser lacks WebMCP when unsupported', () => {
    useWebMcpStatusStore.getState().setStatus('unsupported', 0);

    render(<WebMcpIndicator />);

    const indicator = screen.getByRole('status');
    expect(indicator).toHaveTextContent('Agent tools off');
    expect(indicator).toHaveAttribute('title', expect.stringContaining('WebMCP'));
  });

  it('updates live when registration finishes', () => {
    render(<WebMcpIndicator />);
    expect(screen.getByRole('status')).toHaveTextContent('Agent tools off');

    act(() => {
      useWebMcpStatusStore.getState().setStatus('registered', 8);
    });

    expect(screen.getByRole('status')).toHaveTextContent('Agent tools on');
  });
});
