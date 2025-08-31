import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BoardView } from '../BoardView'
import { useBoardStore } from '@/lib/stores/boardStore'
import { useTaskStore } from '@/lib/stores/taskStore'
import { Task, Board, TaskFilters, SearchState } from '@/lib/types'

// Mock the stores
vi.mock('@/lib/stores/boardStore')
vi.mock('@/lib/stores/taskStore')

// Mock dynamic import
vi.mock('next/dynamic', () => ({
  default: () => {
    return ({ children }: { children: React.ReactNode }) => children
  }
}))

// Mock DragDropProvider
vi.mock('../DragDropProvider', () => ({
  DragDropProvider: ({ children }: { children: React.ReactNode }) => children
}))

const mockBoards: Board[] = [
  {
    id: 'board-1',
    name: 'Current Board',
    color: '#3b82f6',
    isDefault: true,
    order: 0,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'board-2',
    name: 'Other Board',
    color: '#10b981',
    isDefault: false,
    order: 1,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  }
]

const mockTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Current Board Task',
    status: 'todo',
    priority: 'medium',
    tags: [],
    boardId: 'board-1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'task-2',
    title: 'Other Board Task',
    status: 'todo',
    priority: 'high',
    tags: [],
    boardId: 'board-2',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  }
]

interface MockBoardStore {
  currentBoardId: string;
  boards: Board[];
  getCurrentBoard: ReturnType<typeof vi.fn>;
  selectBoard: ReturnType<typeof vi.fn>;
  isLoading: boolean;
  error: string | null;
}

interface MockTaskStore {
  tasks: Task[];
  filteredTasks: Task[];
  filters: TaskFilters;
  searchState: SearchState;
  setHighlightedTask: ReturnType<typeof vi.fn>;
  clearSearch: ReturnType<typeof vi.fn>;
  isLoading: boolean;
  error: string | null;
}

const mockBoardStore: MockBoardStore = {
  currentBoardId: 'board-1',
  boards: mockBoards,
  getCurrentBoard: vi.fn(() => mockBoards[0]),
  selectBoard: vi.fn(),
  isLoading: false,
  error: null,
}

const mockTaskStore: MockTaskStore = {
  tasks: mockTasks,
  filteredTasks: mockTasks,
  filters: {
    search: '',
    tags: [],
    crossBoardSearch: false,
  },
  searchState: {
    scope: 'current-board' as const,
    highlightedTaskId: undefined,
  },
  setHighlightedTask: vi.fn(),
  clearSearch: vi.fn(),
  isLoading: false,
  error: null,
}

describe('BoardView - Cross-board Navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(useBoardStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockBoardStore)
    ;(useTaskStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockTaskStore)
  })

  describe('Single Board Display', () => {
    it('shows only current board tasks by default', () => {
      render(<BoardView />)
      
      expect(screen.getByText('Current Board Task')).toBeInTheDocument()
      expect(screen.queryByText('Other Board Task')).not.toBeInTheDocument()
    })

    it('shows empty search results for single board', () => {
      const emptySearchStore: MockTaskStore = {
        ...mockTaskStore,
        filters: {
          search: 'nonexistent',
          tags: [],
          crossBoardSearch: false,
        },
        filteredTasks: [],
      }
      ;(useTaskStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(emptySearchStore)

      render(<BoardView />)
      
      expect(screen.getByText('No Results Found')).toBeInTheDocument()
      expect(screen.getByText('No tasks found matching "nonexistent" in Current Board.')).toBeInTheDocument()
      expect(screen.getByText('Clear Search')).toBeInTheDocument()
    })

    it('does not show board indicators for current board search', () => {
      const currentBoardSearchStore: MockTaskStore = {
        ...mockTaskStore,
        filters: {
          search: 'task',
          tags: [],
          crossBoardSearch: false, // Current board only
        },
        filteredTasks: [mockTasks[0]], // Only current board task
      }
      ;(useTaskStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(currentBoardSearchStore)

      render(<BoardView />)
      
      expect(screen.getByText('Current Board Task')).toBeInTheDocument()
      // The board name appears in the header, but not as a board indicator badge in task cards
      const boardIndicators = screen.queryAllByText('Current Board')
      // Should only find it in the header (h1), not in task cards (badge)
      expect(boardIndicators.length).toBe(1)
      expect(boardIndicators[0].tagName).toBe('H1')
    })
  })

  describe('Cross-Board Search Display', () => {
    const crossBoardTaskStore: MockTaskStore = {
      ...mockTaskStore,
      filters: {
        search: 'task',
        tags: [],
        crossBoardSearch: true,
      },
      filteredTasks: mockTasks, // Both tasks match search
      searchState: {
        scope: 'all-boards' as const,
        highlightedTaskId: undefined,
      },
    }

    it('shows cross-board search header', () => {
      ;(useTaskStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(crossBoardTaskStore)

      render(<BoardView />)
      
      expect(screen.getByText('Cross-Board Search Results')).toBeInTheDocument()
      expect(screen.getByText('Showing results from 2 boards for "task"')).toBeInTheDocument()
    })

    it('shows cross-board search results when search is active', () => {
      ;(useTaskStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(crossBoardTaskStore)

      render(<BoardView />)
      
      expect(screen.getAllByText('Current Board Task')).toHaveLength(2) // One in kanban, one in grouping
      expect(screen.getAllByText('Other Board Task')).toHaveLength(2) // One in kanban, one in grouping
    })

    it('displays overall stats for cross-board search', () => {
      ;(useTaskStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(crossBoardTaskStore)

      render(<BoardView />)
      
      expect(screen.getByText('Total Tasks: 2')).toBeInTheDocument()
      expect(screen.getByText('To Do: 2')).toBeInTheDocument()
      expect(screen.getByText('In Progress: 0')).toBeInTheDocument()
      expect(screen.getByText('Done: 0')).toBeInTheDocument()
    })

    it('displays board-specific stats', () => {
      ;(useTaskStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(crossBoardTaskStore)

      render(<BoardView />)
      
      expect(screen.getByText('Current Board:')).toBeInTheDocument()
      expect(screen.getByText('Other Board:')).toBeInTheDocument()
      expect(screen.getAllByText('1 (1 todo, 0 in progress, 0 done)')).toHaveLength(2)
    })

    it('disables add task button during cross-board search', () => {
      ;(useTaskStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(crossBoardTaskStore)

      render(<BoardView />)
      
      const addButton = screen.getByRole('button', { name: /add task/i })
      expect(addButton).toBeDisabled()
    })

    it('shows board grouping section', () => {
      ;(useTaskStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(crossBoardTaskStore)

      render(<BoardView />)
      
      expect(screen.getByText('Tasks by Board')).toBeInTheDocument()
      expect(screen.getAllByText('Current Board')).toHaveLength(2) // One in stats, one in grouping
      expect(screen.getAllByText('Other Board')).toHaveLength(2) // One in stats, one in grouping
      expect(screen.getAllByText('(1 tasks)')).toHaveLength(2) // One for each board
    })

    it('shows empty state for cross-board search with no results', () => {
      const emptySearchStore: MockTaskStore = {
        ...crossBoardTaskStore,
        filters: {
          search: 'nonexistent',
          tags: [],
          crossBoardSearch: true,
        },
        filteredTasks: [],
      }
      ;(useTaskStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(emptySearchStore)

      render(<BoardView />)
      
      expect(screen.getByText('No Results Found')).toBeInTheDocument()
      expect(screen.getByText('No tasks found matching "nonexistent" across all boards.')).toBeInTheDocument()
      expect(screen.getByText('Clear Search')).toBeInTheDocument()
    })

    it('handles navigation from board grouping section', async () => {
      ;(useTaskStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(crossBoardTaskStore)

      render(<BoardView />)
      
      const viewBoardButtons = screen.getAllByText('View Board')
      fireEvent.click(viewBoardButtons[0])

      await waitFor(() => {
        expect(mockTaskStore.setHighlightedTask).toHaveBeenCalled()
        expect(mockBoardStore.selectBoard).toHaveBeenCalledWith('board-1')
        expect(mockTaskStore.clearSearch).toHaveBeenCalled()
      })
    })

    it('handles task click navigation from board grouping', async () => {
      ;(useTaskStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(crossBoardTaskStore)

      render(<BoardView />)
      
      // Find a task in the board grouping section (should be the second occurrence)
      const taskElements = screen.getAllByText('Current Board Task')
      const boardGroupingTask = taskElements[1] // Second occurrence should be in board grouping
      
      fireEvent.click(boardGroupingTask)

      await waitFor(() => {
        expect(mockTaskStore.setHighlightedTask).toHaveBeenCalledWith('task-1')
        expect(mockBoardStore.selectBoard).toHaveBeenCalledWith('board-1')
        expect(mockTaskStore.clearSearch).toHaveBeenCalled()
      })
    })
  })

  describe('Task Navigation and Highlighting', () => {
    it('handles board navigation from search results', async () => {
      const crossBoardTaskStore: MockTaskStore = {
        ...mockTaskStore,
        filters: {
          search: 'task',
          tags: [],
          crossBoardSearch: true,
        },
        filteredTasks: mockTasks,
      }
      ;(useTaskStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(crossBoardTaskStore)

      render(<BoardView />)
      
      // Find and click on the other board task in the kanban columns
      const otherBoardTasks = screen.getAllByText('Other Board Task')
      const kanbanTask = otherBoardTasks[0] // First occurrence should be in kanban
      
      // Click directly on the task text element
      fireEvent.click(kanbanTask)
      
      await waitFor(() => {
        expect(mockTaskStore.setHighlightedTask).toHaveBeenCalledWith('task-2')
        expect(mockBoardStore.selectBoard).toHaveBeenCalledWith('board-2')
        expect(mockTaskStore.clearSearch).toHaveBeenCalled()
      })
    })

    it('highlights task after navigation', async () => {
      const highlightedTaskStore: MockTaskStore = {
        ...mockTaskStore,
        searchState: {
          scope: 'current-board' as const,
          highlightedTaskId: 'task-1',
        },
      }
      ;(useTaskStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(highlightedTaskStore)

      render(<BoardView />)
      
      // Check that the highlighted task wrapper has the ring styling
      const taskElements = screen.getAllByText('Current Board Task')
      const highlightedWrapper = taskElements[0].closest('.ring-2')
      expect(highlightedWrapper).toBeInTheDocument()
      expect(highlightedWrapper).toHaveClass('ring-primary')
    })

    it('clears highlight after timeout', async () => {
      vi.useFakeTimers()
      
      const highlightedTaskStore: MockTaskStore = {
        ...mockTaskStore,
        searchState: {
          scope: 'current-board' as const,
          highlightedTaskId: 'task-1',
        },
      }
      ;(useTaskStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(highlightedTaskStore)

      render(<BoardView />)
      
      // Fast-forward time
      vi.advanceTimersByTime(3000)
      
      // The useEffect should call setHighlightedTask with undefined
      expect(mockTaskStore.setHighlightedTask).toHaveBeenCalledWith(undefined)
      
      vi.useRealTimers()
    })

    it('handles navigation errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const failingBoardStore: MockBoardStore = {
        ...mockBoardStore,
        selectBoard: vi.fn().mockRejectedValue(new Error('Navigation failed')),
      }
      ;(useBoardStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(failingBoardStore)

      const crossBoardTaskStore: MockTaskStore = {
        ...mockTaskStore,
        filters: {
          search: 'task',
          tags: [],
          crossBoardSearch: true,
        },
        filteredTasks: mockTasks,
      }
      ;(useTaskStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(crossBoardTaskStore)

      render(<BoardView />)
      
      const otherBoardTasks = screen.getAllByText('Other Board Task')
      const kanbanTask = otherBoardTasks[0] // First occurrence should be in kanban
      
      // Click directly on the task text element
      fireEvent.click(kanbanTask)
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to navigate to board:', expect.any(Error))
      })

      consoleSpy.mockRestore()
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('handles missing board data gracefully', () => {
      const taskWithMissingBoard: Task = {
        ...mockTasks[0],
        boardId: 'non-existent-board',
      }
      
      const crossBoardTaskStore: MockTaskStore = {
        ...mockTaskStore,
        filters: {
          search: 'task',
          tags: [],
          crossBoardSearch: true,
        },
        filteredTasks: [taskWithMissingBoard],
      }
      ;(useTaskStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(crossBoardTaskStore)

      render(<BoardView />)
      
      // Should still render the task even without board data
      expect(screen.getByText('Current Board Task')).toBeInTheDocument()
    })

    it('clears search when clear button is clicked', () => {
      const emptySearchStore: MockTaskStore = {
        ...mockTaskStore,
        filters: {
          search: 'nonexistent',
          tags: [],
          crossBoardSearch: false,
        },
        filteredTasks: [],
      }
      ;(useTaskStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(emptySearchStore)

      render(<BoardView />)
      
      const clearButton = screen.getByText('Clear Search')
      fireEvent.click(clearButton)

      expect(mockTaskStore.clearSearch).toHaveBeenCalled()
    })

    it('handles empty board groups in cross-board search', () => {
      const emptyGroupsStore: MockTaskStore = {
        ...mockTaskStore,
        filters: {
          search: 'task',
          tags: [],
          crossBoardSearch: true,
        },
        filteredTasks: [],
        searchState: {
          scope: 'all-boards' as const,
          highlightedTaskId: undefined,
        },
      }
      ;(useTaskStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(emptyGroupsStore)

      render(<BoardView />)
      
      expect(screen.getByText('Cross-Board Search Results')).toBeInTheDocument()
      expect(screen.getByText('Showing results from 0 boards for "task"')).toBeInTheDocument()
      expect(screen.queryByText('Tasks by Board')).not.toBeInTheDocument()
    })
  })
})