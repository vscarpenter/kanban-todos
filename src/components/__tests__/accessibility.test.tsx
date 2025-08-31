import { render, screen, fireEvent } from '@testing-library/react';
import { SearchBar } from '../SearchBar';
import { BoardIndicator } from '../BoardIndicator';
import { TaskCard } from '../kanban/TaskCard';
import { CrossBoardNavigationHandler } from '../CrossBoardNavigationHandler';
import { useTaskStore } from '@/lib/stores/taskStore';
import { useBoardStore } from '@/lib/stores/boardStore';
import { useSettingsStore } from '@/lib/stores/settingsStore';
import { Task, Board } from '@/lib/types';

// Mock user interactions
const mockUserEvent = {
  setup: () => ({
    type: async (element: HTMLElement, text: string) => {
      fireEvent.change(element, { target: { value: text } });
    },
    keyboard: async (keys: string) => {
      if (keys === '{Enter}') {
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement) {
          fireEvent.keyDown(activeElement, { key: 'Enter' });
        }
      } else if (keys === '{Escape}') {
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement) {
          fireEvent.keyDown(activeElement, { key: 'Escape' });
        }
      } else if (keys === ' ') {
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement) {
          fireEvent.keyDown(activeElement, { key: ' ' });
        }
      }
    },
    tab: async () => {
      fireEvent.keyDown(document.activeElement || document.body, { key: 'Tab' });
    },
  }),
};

import { vi, describe, it, beforeEach, expect } from 'vitest';

// Mock stores
vi.mock('@/lib/stores/taskStore');
vi.mock('@/lib/stores/boardStore');
vi.mock('@/lib/stores/settingsStore');

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

const mockTask: Task = {
  id: 'task-1',
  title: 'Test Task',
  description: 'Test description',
  status: 'todo',
  priority: 'medium',
  tags: ['tag1', 'tag2'],
  boardId: 'board-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  progress: 50,
  dueDate: new Date(Date.now() + 86400000), // Tomorrow
};

const mockBoard: Board = {
  id: 'board-1',
  name: 'Test Board',
  color: '#3b82f6',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockUseTaskStore = vi.mocked(useTaskStore);
const mockUseBoardStore = vi.mocked(useBoardStore);
const mockUseSettingsStore = vi.mocked(useSettingsStore);

describe('Accessibility Tests', () => {
  beforeEach(() => {
    mockUseTaskStore.mockReturnValue({
      filters: { search: '', tags: [], crossBoardSearch: false },
      setFilters: vi.fn(),
      setSearchQuery: vi.fn(),
      setCrossBoardSearch: vi.fn(),
      clearFilters: vi.fn(),
      isSearching: false,
      error: null,
      getSearchPerformanceMetrics: () => ({
        lastSearchDuration: 100,
        averageSearchDuration: 120,
        searchCount: 5,
      }),
      tasks: [mockTask],
      filteredTasks: [mockTask],
      deleteTask: vi.fn(),
      archiveTask: vi.fn(),
      navigateToTaskBoard: vi.fn(),
    });

    mockUseBoardStore.mockReturnValue({
      boards: [mockBoard],
      setCurrentBoard: vi.fn(),
    });

    mockUseSettingsStore.mockReturnValue({
      settings: {
        searchPreferences: {
          defaultScope: 'current-board' as const,
          rememberScope: true,
        },
      },
      updateSettings: vi.fn(),
    });
  });

  describe('SearchBar Accessibility', () => {

    it('should have proper ARIA labels and roles', () => {
      render(<SearchBar />);
      
      const searchInput = screen.getByRole('searchbox');
      expect(searchInput).toHaveAttribute('aria-label', 'Search tasks in current board');
      expect(searchInput).toHaveAttribute('aria-autocomplete', 'list');
      
      const filterButton = screen.getByRole('button', { name: /open filters menu/i });
      expect(filterButton).toHaveAttribute('aria-haspopup', 'dialog');
    });

    it('should support keyboard navigation', async () => {
      const user = mockUserEvent.setup();
      render(<SearchBar />);
      
      const searchInput = screen.getByRole('searchbox');
      
      // Test Enter key
      await user.type(searchInput, 'test query');
      fireEvent.keyDown(searchInput, { key: 'Enter' });
      
      // Test Escape key
      fireEvent.keyDown(searchInput, { key: 'Escape' });
      expect(searchInput).toHaveValue('');
    });

    it('should announce search results to screen readers', async () => {
      render(<SearchBar />);
      
      // Simulate search with results
      mockUseTaskStore.mockReturnValue({
        ...mockUseTaskStore(),
        filters: { search: 'test', tags: [], crossBoardSearch: false },
        filteredTasks: [mockTask],
      });
      
      const { rerender } = render(<SearchBar />);
      rerender(<SearchBar />);
      
      const resultsStatus = screen.getByRole('status');
      expect(resultsStatus).toHaveAttribute('aria-live', 'polite');
      expect(resultsStatus).toHaveTextContent('Found 1 task in current board');
    });

    it('should announce errors to screen readers', async () => {
      mockUseTaskStore.mockReturnValue({
        ...mockUseTaskStore(),
        error: 'Search failed',
      });
      
      render(<SearchBar />);
      
      const errorAlert = screen.getByRole('alert');
      expect(errorAlert).toHaveAttribute('aria-live', 'polite');
      expect(errorAlert).toHaveTextContent('Search failed');
    });

    it('should have accessible cross-board search toggle', () => {
      render(<SearchBar />);
      
      // Open filters
      const filterButton = screen.getByRole('button', { name: /open filters menu/i });
      fireEvent.click(filterButton);
      
      const toggle = screen.getByRole('switch', { name: /toggle cross-board search/i });
      expect(toggle).toHaveAttribute('aria-describedby', 'cross-board-search-description');
      
      const label = screen.getByLabelText('Search all boards');
      expect(label).toBeInTheDocument();
    });
  });

  describe('BoardIndicator Accessibility', () => {

    it('should have proper ARIA labels and roles', () => {
      render(<BoardIndicator board={mockBoard} isCurrentBoard={true} />);
      
      const indicator = screen.getByRole('img');
      expect(indicator).toHaveAttribute('aria-label', 'Board: Test Board (current board)');
      expect(indicator).toHaveAttribute('title', 'Test Board (current board)');
    });

    it('should be focusable with keyboard', () => {
      render(<BoardIndicator board={mockBoard} isCurrentBoard={false} />);
      
      const indicator = screen.getByRole('img');
      expect(indicator).toHaveAttribute('tabIndex', '0');
    });

    it('should have hover states', () => {
      render(<BoardIndicator board={mockBoard} isCurrentBoard={false} />);
      
      const indicator = screen.getByRole('img');
      expect(indicator).toHaveClass('hover:bg-accent/30');
    });
  });

  describe('TaskCard Accessibility', () => {

    it('should have proper semantic structure', () => {
      render(<TaskCard task={mockTask} />);
      
      const article = screen.getByRole('article');
      expect(article).toHaveAttribute('aria-labelledby', 'task-title-task-1');
      expect(article).toHaveAttribute('aria-describedby', 'task-meta-task-1');
      
      const title = screen.getByRole('heading', { level: 3 });
      expect(title).toHaveAttribute('id', 'task-title-task-1');
    });

    it('should support keyboard navigation for cross-board tasks', async () => {
      const mockNavigate = vi.fn();
      
      render(
        <TaskCard 
          task={mockTask} 
          showBoardIndicator={true}
          board={mockBoard}
          isCurrentBoard={false}
          onNavigateToBoard={mockNavigate}
        />
      );
      
      const taskButton = screen.getByRole('button', { name: /navigate to task/i });
      expect(taskButton).toHaveAttribute('tabIndex', '0');
      
      // Test Enter key
      fireEvent.keyDown(taskButton, { key: 'Enter' });
      expect(mockNavigate).toHaveBeenCalledWith('board-1', 'task-1');
      
      // Test Space key
      fireEvent.keyDown(taskButton, { key: ' ' });
      expect(mockNavigate).toHaveBeenCalledTimes(2);
    });

    it('should have accessible progress bar', () => {
      const taskWithProgress = { ...mockTask, status: 'in-progress' as const, progress: 75 };
      render(<TaskCard task={taskWithProgress} />);
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '75');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
      expect(progressBar).toHaveAttribute('aria-label', 'Task progress: 75% complete');
    });

    it('should announce overdue tasks as alerts', () => {
      const overdueTask = { 
        ...mockTask, 
        dueDate: new Date(Date.now() - 86400000) // Yesterday
      };
      render(<TaskCard task={overdueTask} />);
      
      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-label', expect.stringContaining('Overdue'));
    });

    it('should have accessible task options menu', () => {
      render(<TaskCard task={mockTask} />);
      
      const menuButton = screen.getByRole('button', { name: /task options for test task/i });
      expect(menuButton).toHaveClass('focus-visible:ring-2');
    });

    it('should have accessible tags list', () => {
      render(<TaskCard task={mockTask} />);
      
      const tagsList = screen.getByRole('list', { name: 'Task tags' });
      expect(tagsList).toBeInTheDocument();
      
      const tags = screen.getAllByRole('listitem');
      expect(tags).toHaveLength(2);
    });
  });

  describe('CrossBoardNavigationHandler Focus Management', () => {
    it('should have focus management functionality', () => {
      render(
        <CrossBoardNavigationHandler>
          <div>Test content</div>
        </CrossBoardNavigationHandler>
      );
      
      // Just verify the component renders without errors
      // Focus management is tested in integration tests
      expect(screen.getByText('Test content')).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation Integration', () => {
    it('should have proper tab indices for interactive elements', () => {
      render(
        <div>
          <SearchBar />
          <TaskCard task={mockTask} />
        </div>
      );
      
      // Check that interactive elements are focusable
      const searchInput = screen.getByRole('searchbox');
      expect(searchInput).not.toHaveAttribute('tabIndex', '-1');
      
      const filterButton = screen.getByRole('button', { name: /open filters menu/i });
      expect(filterButton).not.toHaveAttribute('tabIndex', '-1');
      
      const searchButton = screen.getByRole('button', { name: /execute search/i });
      expect(searchButton).not.toHaveAttribute('tabIndex', '-1');
    });

    it('should have proper focus indicators', () => {
      render(<TaskCard task={mockTask} />);
      
      const taskOptionsButton = screen.getByRole('button', { name: /task options/i });
      expect(taskOptionsButton).toHaveClass('focus-visible:ring-2');
    });
  });
});