import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BoardIndicator } from '../BoardIndicator';
import { Board } from '@/lib/types';

const mockBoard: Board = {
  id: 'board-1',
  name: 'Test Board',
  description: 'Test board description',
  color: '#3b82f6',
  isDefault: false,
  order: 1,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

describe('BoardIndicator', () => {
  it('renders board name and color dot', () => {
    const { container } = render(
      <BoardIndicator 
        board={mockBoard} 
        isCurrentBoard={false} 
      />
    );
    
    expect(screen.getByText('Test Board')).toBeInTheDocument();
    
    // Check that color dot is rendered with correct background color
    const colorDot = container.querySelector('.rounded-full');
    expect(colorDot).toHaveStyle({ backgroundColor: 'rgb(59, 130, 246)' });
  });

  it('applies current board styling when isCurrentBoard is true', () => {
    render(
      <BoardIndicator 
        board={mockBoard} 
        isCurrentBoard={true} 
      />
    );
    
    const badge = screen.getByText('Test Board').closest('[data-slot="badge"]');
    expect(badge).toHaveClass('bg-accent/50');
  });

  it('applies other board styling when isCurrentBoard is false', () => {
    render(
      <BoardIndicator 
        board={mockBoard} 
        isCurrentBoard={false} 
      />
    );
    
    const badge = screen.getByText('Test Board').closest('[data-slot="badge"]');
    expect(badge).toHaveClass('text-muted-foreground');
  });

  it('truncates long board names for small size', () => {
    const longNameBoard: Board = {
      ...mockBoard,
      name: 'This is a very long board name that should be truncated',
    };
    
    render(
      <BoardIndicator 
        board={longNameBoard} 
        isCurrentBoard={false} 
        size="sm"
      />
    );
    
    // The actual truncated text includes spaces, so we check for the expected pattern
    expect(screen.getByText('This is a very ...')).toBeInTheDocument();
  });

  it('allows longer names for medium size', () => {
    const longNameBoard: Board = {
      ...mockBoard,
      name: 'This is a moderately long board name',
    };
    
    render(
      <BoardIndicator 
        board={longNameBoard} 
        isCurrentBoard={false} 
        size="md"
      />
    );
    
    // For medium size, this name should be truncated since it's longer than 25 chars
    expect(screen.getByText('This is a moderately long...')).toBeInTheDocument();
  });

  it('hides name when showName is false', () => {
    const { container } = render(
      <BoardIndicator 
        board={mockBoard} 
        isCurrentBoard={false} 
        showName={false}
      />
    );
    
    expect(screen.queryByText('Test Board')).not.toBeInTheDocument();
    
    // Color dot should still be present
    const colorDot = container.querySelector('.rounded-full');
    expect(colorDot).toHaveStyle({ backgroundColor: 'rgb(59, 130, 246)' });
  });

  it('applies medium size styling correctly', () => {
    const { container } = render(
      <BoardIndicator 
        board={mockBoard} 
        isCurrentBoard={false} 
        size="md"
      />
    );
    
    const badge = screen.getByText('Test Board').closest('[data-slot="badge"]');
    expect(badge).toHaveClass('px-2.5', 'py-1.5', 'text-sm');
    
    // Check for larger dot size
    const colorDot = container.querySelector('.rounded-full');
    expect(colorDot).toHaveClass('h-4', 'w-4');
  });

  it('applies small size styling by default', () => {
    const { container } = render(
      <BoardIndicator 
        board={mockBoard} 
        isCurrentBoard={false} 
      />
    );
    
    // Check for smaller dot size (default)
    const colorDot = container.querySelector('.rounded-full');
    expect(colorDot).toHaveClass('h-3', 'w-3');
  });

  it('applies custom className', () => {
    render(
      <BoardIndicator 
        board={mockBoard} 
        isCurrentBoard={false} 
        className="custom-class"
      />
    );
    
    const badge = screen.getByText('Test Board').closest('[data-slot="badge"]');
    expect(badge).toHaveClass('custom-class');
  });

  it('shows short names without truncation', () => {
    const shortNameBoard: Board = {
      ...mockBoard,
      name: 'Short',
    };
    
    render(
      <BoardIndicator 
        board={shortNameBoard} 
        isCurrentBoard={false} 
        size="sm"
      />
    );
    
    expect(screen.getByText('Short')).toBeInTheDocument();
  });
});