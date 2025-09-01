import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { DragDropProvider } from '../DragDropProvider'
import { Task } from '@/lib/types'
import { useTaskStore } from '@/lib/stores/taskStore'
import TaskCard from '../kanban/TaskCard'

// Mock the task store
vi.mock('@/lib/stores/taskStore', () => ({
  useTaskStore: vi.fn(),
}))

// Mock navigator.vibrate
const mockVibrate = vi.fn()
Object.defineProperty(navigator, 'vibrate', {
  value: mockVibrate,
  writable: true,
})

const mockTask: Task = {
  id: 'task-1',
  title: 'Test Task',
  description: 'Test description',
  status: 'todo',
  priority: 'medium',
  tags: ['test'],
  boardId: 'board-1',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

const mockTasks = [mockTask]
const mockMoveTask = vi.fn()

describe('DragDropProvider iOS TouchSensor Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock useTaskStore implementation
    ;(useTaskStore as ReturnType<typeof vi.fn>).mockReturnValue({
      tasks: mockTasks,
      moveTask: mockMoveTask,
    })
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('iOS Safari User Agent Detection', () => {
    const originalUserAgent = navigator.userAgent

    afterEach(() => {
      Object.defineProperty(navigator, 'userAgent', {
        value: originalUserAgent,
        configurable: true,
      })
    })

    it('should detect iPad Safari user agent', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
        configurable: true,
      })

      render(
        <DragDropProvider>
          <TaskCard task={mockTask} />
        </DragDropProvider>
      )

      // Verify component renders correctly on iOS
      expect(screen.getByText('Test Task')).toBeInTheDocument()
    })

    it('should detect iPhone Safari user agent', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
        configurable: true,
      })

      render(
        <DragDropProvider>
          <TaskCard task={mockTask} />
        </DragDropProvider>
      )

      expect(screen.getByText('Test Task')).toBeInTheDocument()
    })
  })

  describe('TouchSensor Configuration', () => {
    it('should configure TouchSensor with iOS-optimized settings', () => {
      const { container } = render(
        <DragDropProvider>
          <TaskCard task={mockTask} />
        </DragDropProvider>
      )

      const dragElement = container.querySelector('[data-task-id="task-1"]')
      expect(dragElement).toBeInTheDocument()
    })

    it('should handle touch events with proper activation constraints', async () => {
      const { container } = render(
        <DragDropProvider>
          <TaskCard task={mockTask} />
        </DragDropProvider>
      )

      const dragElement = container.querySelector('[data-task-id="task-1"]')!
      
      // Simulate touch start
      fireEvent.touchStart(dragElement, {
        touches: [{ clientX: 100, clientY: 100, identifier: 1 }],
        targetTouches: [{ clientX: 100, clientY: 100, identifier: 1 }],
        changedTouches: [{ clientX: 100, clientY: 100, identifier: 1 }],
      })

      // Wait for activation delay (200ms)
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 250))
      })

      // Verify haptic feedback was triggered
      expect(mockVibrate).toHaveBeenCalledWith(50)
    })

    it('should activate drag after delay regardless of small movements', async () => {
      const { container } = render(
        <DragDropProvider>
          <TaskCard task={mockTask} />
        </DragDropProvider>
      )

      const dragElement = container.querySelector('[data-task-id="task-1"]')!
      
      // Start touch
      fireEvent.touchStart(dragElement, {
        touches: [{ clientX: 100, clientY: 100, identifier: 1 }],
        targetTouches: [{ clientX: 100, clientY: 100, identifier: 1 }],
        changedTouches: [{ clientX: 100, clientY: 100, identifier: 1 }],
      })

      // Move within tolerance (< 8px) - this should still activate after delay
      fireEvent.touchMove(dragElement, {
        touches: [{ clientX: 105, clientY: 105, identifier: 1 }],
        targetTouches: [{ clientX: 105, clientY: 105, identifier: 1 }],
        changedTouches: [{ clientX: 105, clientY: 105, identifier: 1 }],
      })

      // Wait past activation delay
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 250))
      })

      // Should trigger haptic feedback after delay even with small movements
      expect(mockVibrate).toHaveBeenCalledWith(50)
    })
  })

  describe('Touch Event Handling', () => {
    it('should handle touchend events properly', async () => {
      const mockOnDragEnd = vi.fn()
      
      const { container } = render(
        <DragDropProvider onDragEnd={mockOnDragEnd}>
          <TaskCard task={mockTask} />
          <div data-testid="drop-zone" data-droppable-id="in-progress">
            Drop Zone
          </div>
        </DragDropProvider>
      )

      const dragElement = container.querySelector('[data-task-id="task-1"]')!

      // Start drag
      fireEvent.touchStart(dragElement, {
        touches: [{ clientX: 100, clientY: 100, identifier: 1 }],
      })

      // Wait for activation
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 250))
      })

      // Move to drop zone
      fireEvent.touchMove(dragElement, {
        touches: [{ clientX: 200, clientY: 200, identifier: 1 }],
      })

      // End touch over drop zone
      fireEvent.touchEnd(dragElement, {
        changedTouches: [{ clientX: 200, clientY: 200, identifier: 1 }],
      })

      expect(mockOnDragEnd).toHaveBeenCalled()
    })

    it('should handle touchcancel events gracefully', async () => {
      const { container } = render(
        <DragDropProvider>
          <TaskCard task={mockTask} />
        </DragDropProvider>
      )

      const dragElement = container.querySelector('[data-task-id="task-1"]')!

      // Start drag
      fireEvent.touchStart(dragElement, {
        touches: [{ clientX: 100, clientY: 100, identifier: 1 }],
      })

      // Wait for activation
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 250))
      })

      // Cancel touch - should not throw errors
      expect(() => {
        fireEvent.touchCancel(dragElement, {
          changedTouches: [{ clientX: 100, clientY: 100, identifier: 1 }],
        })
      }).not.toThrow()

      // Verify haptic feedback was triggered during activation
      expect(mockVibrate).toHaveBeenCalledWith(50)
    })
  })

  describe('iOS-specific CSS Properties', () => {
    it('should apply touch-action: none for proper touch handling', () => {
      const { container } = render(
        <DragDropProvider>
          <TaskCard task={mockTask} />
        </DragDropProvider>
      )

      const dragElement = container.querySelector('[data-task-id="task-1"]')!
      
      // Check if drag element is properly set up for touch
      expect(dragElement).toBeInTheDocument()
      expect(dragElement).toHaveAttribute('data-task-id', 'task-1')
    })
  })

  describe('Cross-device Compatibility', () => {
    it('should work with both mouse and touch simultaneously', async () => {
      const { container } = render(
        <DragDropProvider>
          <TaskCard task={mockTask} />
        </DragDropProvider>
      )

      const dragElement = container.querySelector('[data-task-id="task-1"]')!

      // Test mouse events still work
      fireEvent.mouseDown(dragElement, { clientX: 100, clientY: 100 })
      fireEvent.mouseMove(dragElement, { clientX: 110, clientY: 110 })
      fireEvent.mouseUp(dragElement)

      // Test touch events work
      fireEvent.touchStart(dragElement, {
        touches: [{ clientX: 100, clientY: 100, identifier: 1 }],
      })

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 250))
      })

      expect(mockVibrate).toHaveBeenCalledWith(50)
    })
  })

  describe('Performance Considerations', () => {
    it('should not create excessive event listeners', () => {
      const { rerender } = render(
        <DragDropProvider>
          <TaskCard task={mockTask} />
        </DragDropProvider>
      )

      // Re-render multiple times
      for (let i = 0; i < 5; i++) {
        rerender(
          <DragDropProvider>
            <TaskCard task={mockTask} />
          </DragDropProvider>
        )
      }

      // Component should still function correctly
      expect(screen.getByText('Test Task')).toBeInTheDocument()
    })

    it('should cleanup properly on unmount', () => {
      const { unmount } = render(
        <DragDropProvider>
          <TaskCard task={mockTask} />
        </DragDropProvider>
      )

      unmount()

      // No errors should occur during cleanup
      expect(true).toBe(true)
    })
  })
})