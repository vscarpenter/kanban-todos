import { describe, it, expect, vi, beforeEach } from 'vitest'
import { 
  applyFiltersToTasks,
  createSetFilters,
  createSetBoardFilter,
  createSetCrossBoardSearch,
  createSetSearchQuery,
  createClearFilters,
  createClearSearch,
  createSetHighlightedTask,
} from '../taskStore.filters'
import { Task, TaskFilters, SearchScope } from '@/lib/types'
import { sanitizeSearchQuery, searchRateLimiter } from '@/lib/utils/security'
import { searchTasks } from '@/lib/utils/taskSearch'

// Mock dependencies
vi.mock('@/lib/utils/security', () => ({
  sanitizeSearchQuery: vi.fn((query) => query.trim()),
  searchRateLimiter: {
    isAllowed: vi.fn(() => true),
  },
}))

vi.mock('@/lib/utils/taskSearch', () => ({
  searchTasks: vi.fn(),
}))

vi.mock('@/lib/utils/taskFiltering', () => ({
  validateBoardAccess: vi.fn(),
  generateCacheKey: vi.fn(() => 'cache-key'),
  checkCache: vi.fn(() => null),
  cacheResults: vi.fn(),
  cleanupExpiredCache: vi.fn(),
  isComplexSearch: vi.fn(() => false),
}))

vi.mock('@/lib/utils/taskValidation', () => ({
  validateTaskCollection: vi.fn((tasks) => tasks),
}))

vi.mock('@/lib/utils/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
  },
}))

const mockSearchTasks = searchTasks as vi.Mock
const mockSanitizeSearchQuery = sanitizeSearchQuery as vi.Mock

describe('taskStore.filters', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(mockSearchTasks).mockImplementation((tasks, query) => 
      tasks.filter(task => task.title.toLowerCase().includes(query.toLowerCase()))
    )
    vi.mocked(mockSanitizeSearchQuery).mockImplementation((query) => query.trim())
  })

  const sampleTasks: Task[] = [
    {
      id: '1',
      title: 'Complete project',
      boardId: 'board-1',
      status: 'todo',
      priority: 'high',
      tags: ['work', 'urgent'],
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: '2',
      title: 'Review code',
      boardId: 'board-1',
      status: 'in-progress',
      priority: 'medium',
      tags: ['work'],
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02'),
    },
    {
      id: '3',
      title: 'Buy groceries',
      boardId: 'board-2',
      status: 'todo',
      priority: 'low',
      tags: ['personal'],
      createdAt: new Date('2024-01-03'),
      updatedAt: new Date('2024-01-03'),
    },
  ]

  describe('applyFiltersToTasks', () => {
    it('should return all tasks when no filters are applied', () => {
      const filters: TaskFilters = {
        search: '',
        tags: [],
        crossBoardSearch: false,
      }
      
      const result = applyFiltersToTasks(sampleTasks, filters)
      
      expect(result).toHaveLength(3)
    })

    it('should filter by board ID', () => {
      const filters: TaskFilters = {
        search: '',
        tags: [],
        boardId: 'board-1',
        crossBoardSearch: false,
      }
      
      const result = applyFiltersToTasks(sampleTasks, filters)
      
      expect(result).toHaveLength(2)
      expect(result.every(task => task.boardId === 'board-1')).toBe(true)
    })

    it('should not filter by board ID when cross-board search is enabled', () => {
      const filters: TaskFilters = {
        search: '',
        tags: [],
        boardId: 'board-1',
        crossBoardSearch: true,
      }
      
      const result = applyFiltersToTasks(sampleTasks, filters)
      
      expect(result).toHaveLength(3)
    })

    it('should filter by status', () => {
      const filters: TaskFilters = {
        search: '',
        tags: [],
        status: 'todo',
        crossBoardSearch: false,
      }
      
      const result = applyFiltersToTasks(sampleTasks, filters)
      
      expect(result).toHaveLength(2)
      expect(result.every(task => task.status === 'todo')).toBe(true)
    })

    it('should filter by priority', () => {
      const filters: TaskFilters = {
        search: '',
        tags: [],
        priority: 'high',
        crossBoardSearch: false,
      }
      
      const result = applyFiltersToTasks(sampleTasks, filters)
      
      expect(result).toHaveLength(1)
      expect(result[0].priority).toBe('high')
    })

    it('should filter by tags', () => {
      const filters: TaskFilters = {
        search: '',
        tags: ['work'],
        crossBoardSearch: false,
      }
      
      const result = applyFiltersToTasks(sampleTasks, filters)
      
      expect(result).toHaveLength(2)
      expect(result.every(task => task.tags.includes('work'))).toBe(true)
    })

    it('should filter by date range', () => {
      const filters: TaskFilters = {
        search: '',
        tags: [],
        dateRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-02'),
        },
        crossBoardSearch: false,
      }
      
      const result = applyFiltersToTasks(sampleTasks, filters)
      
      expect(result).toHaveLength(2)
    })

    it('should filter by search query', () => {
      const filters: TaskFilters = {
        search: 'project',
        tags: [],
        crossBoardSearch: false,
      }
      
      const result = applyFiltersToTasks(sampleTasks, filters)
      
      expect(result).toHaveLength(1)
      expect(result[0].title).toContain('project')
    })

    it('should return empty array when no tasks match filters', () => {
      const filters: TaskFilters = {
        search: '',
        tags: [],
        status: 'done',
        crossBoardSearch: false,
      }
      
      const result = applyFiltersToTasks(sampleTasks, filters)
      
      expect(result).toHaveLength(0)
    })

    it('should handle empty task array', () => {
      const filters: TaskFilters = {
        search: '',
        tags: [],
        crossBoardSearch: false,
      }
      
      const result = applyFiltersToTasks([], filters)
      
      expect(result).toHaveLength(0)
    })
  })

  
})