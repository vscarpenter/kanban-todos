import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createExportTasks } from '../taskStore.import'
import { Task } from '@/lib/types'
import { exportTasks as exportTasksUtil } from '@/lib/utils/exportImport'

// Mock dependencies
vi.mock('@/lib/utils/database', () => ({
  taskDB: {
    addTask: vi.fn().mockResolvedValue(undefined),
    updateTask: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock('@/lib/utils/exportImport', () => ({
  exportTasks: vi.fn(),
}))

const mockTaskDB = {
  addTask: vi.fn().mockResolvedValue(undefined),
  updateTask: vi.fn().mockResolvedValue(undefined),
}

const mockExportTasksUtil = exportTasksUtil as vi.Mock

describe('taskStore.import', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(mockTaskDB.addTask).mockResolvedValue(undefined)
    vi.mocked(mockTaskDB.updateTask).mockResolvedValue(undefined)
  })

  describe('createExportTasks', () => {
    it('should export tasks with default options', () => {
      const tasks: Task[] = [
        { id: '1', title: 'Task 1', boardId: 'board-1', status: 'todo', priority: 'medium', tags: [], createdAt: new Date(), updatedAt: new Date() },
      ]
      
      const get = () => ({ tasks, applyFilters: vi.fn().mockResolvedValue(undefined) })
      const exportTasks = createExportTasks(get)
      
      mockExportTasksUtil.mockReturnValue({ tasks, boards: [], settings: {} })
      
      const result = exportTasks()
      
      expect(mockExportTasksUtil).toHaveBeenCalledWith(tasks, { includeArchived: true })
      expect(result).toEqual({ tasks, boards: [], settings: {} })
    })

    it('should export tasks with custom options', () => {
      const tasks: Task[] = [
        { id: '1', title: 'Task 1', boardId: 'board-1', status: 'todo', priority: 'medium', tags: [], createdAt: new Date(), updatedAt: new Date() },
      ]
      
      const get = () => ({ tasks, applyFilters: vi.fn().mockResolvedValue(undefined) })
      const exportTasks = createExportTasks(get)
      
      mockExportTasksUtil.mockReturnValue({ tasks, boards: [], settings: {} })
      
      const result = exportTasks({ includeArchived: false })
      
      expect(mockExportTasksUtil).toHaveBeenCalledWith(tasks, { includeArchived: false })
      expect(result).toEqual({ tasks, boards: [], settings: {} })
    })
  })

  
})
