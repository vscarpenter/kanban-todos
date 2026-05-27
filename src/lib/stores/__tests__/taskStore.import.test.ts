import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createExportTasks } from '../taskStore.import'
import { Task } from '@/lib/types'
import { exportTasks as exportTasksUtil } from '@/lib/utils/exportImport'
import type { ExportData, SerializedTask } from '@/lib/utils/exportImport'

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

const mockExportTasksUtil = vi.mocked(exportTasksUtil)

function serializeTestTask(task: Task): SerializedTask {
  return {
    ...task,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    completedAt: task.completedAt?.toISOString(),
    archivedAt: task.archivedAt?.toISOString(),
    dueDate: task.dueDate?.toISOString(),
  }
}

function createExportResult(tasks: Task[]): ExportData {
  return {
    version: '1.0.0',
    exportedAt: '2026-01-02T03:04:05.000Z',
    tasks: tasks.map(serializeTestTask),
    boards: [],
  }
}

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
      const exportResult = createExportResult(tasks)
      
      mockExportTasksUtil.mockReturnValue(exportResult)
      
      const result = exportTasks()
      
      expect(mockExportTasksUtil).toHaveBeenCalledWith(tasks, { includeArchived: true })
      expect(result).toEqual(exportResult)
    })

    it('should export tasks with custom options', () => {
      const tasks: Task[] = [
        { id: '1', title: 'Task 1', boardId: 'board-1', status: 'todo', priority: 'medium', tags: [], createdAt: new Date(), updatedAt: new Date() },
      ]
      
      const get = () => ({ tasks, applyFilters: vi.fn().mockResolvedValue(undefined) })
      const exportTasks = createExportTasks(get)
      const exportResult = createExportResult(tasks)
      
      mockExportTasksUtil.mockReturnValue(exportResult)
      
      const result = exportTasks({ includeArchived: false })
      
      expect(mockExportTasksUtil).toHaveBeenCalledWith(tasks, { includeArchived: false })
      expect(result).toEqual(exportResult)
    })
  })

  
})
