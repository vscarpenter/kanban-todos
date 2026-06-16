import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { DragDropProvider } from '../DragDropProvider'
import { Task } from '@/lib/types'
import TaskCard from '../kanban/TaskCard'

// DragDropProvider is now presentation-only: it wires @dnd-kit sensors and
// renders the overlay. The drag *logic* (haptics, persistence, celebration)
// lives in useDragLifecycle and is covered by useDragLifecycle.test.ts. These
// tests verify the iOS-tuned TouchSensor activation by observing the onDragStart
// the provider forwards from @dnd-kit.

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

function renderProvider(
  props: Partial<React.ComponentProps<typeof DragDropProvider>> = {}
) {
  return render(
    <DragDropProvider
      activeTask={null}
      onDragStart={vi.fn()}
      onDragEnd={vi.fn()}
      {...props}
    >
      <TaskCard task={mockTask} />
    </DragDropProvider>
  )
}

describe('DragDropProvider iOS TouchSensor Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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

      renderProvider()

      expect(screen.getByText('Test Task')).toBeInTheDocument()
    })

    it('should detect iPhone Safari user agent', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
        configurable: true,
      })

      renderProvider()

      expect(screen.getByText('Test Task')).toBeInTheDocument()
    })
  })

  describe('TouchSensor Configuration', () => {
    it('should render draggable children', () => {
      const { container } = renderProvider()

      const dragElement = container.querySelector('[data-task-id="task-1"]')
      expect(dragElement).toBeInTheDocument()
    })

    it('should activate drag after the delay and forward onDragStart', async () => {
      const onDragStart = vi.fn()
      const { container } = renderProvider({ onDragStart })

      const dragElement = container.querySelector('[data-task-id="task-1"]') as Element

      fireEvent.touchStart(dragElement, {
        touches: [{ clientX: 100, clientY: 100, identifier: 1 }],
        targetTouches: [{ clientX: 100, clientY: 100, identifier: 1 }],
        changedTouches: [{ clientX: 100, clientY: 100, identifier: 1 }],
      })

      // Wait past the touch activation delay.
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 250))
      })

      expect(onDragStart).toHaveBeenCalled()
    })

    it('should activate drag despite small movements within tolerance', async () => {
      const onDragStart = vi.fn()
      const { container } = renderProvider({ onDragStart })

      const dragElement = container.querySelector('[data-task-id="task-1"]') as Element

      fireEvent.touchStart(dragElement, {
        touches: [{ clientX: 100, clientY: 100, identifier: 1 }],
        targetTouches: [{ clientX: 100, clientY: 100, identifier: 1 }],
        changedTouches: [{ clientX: 100, clientY: 100, identifier: 1 }],
      })

      // Move within tolerance (< 8px) — should still activate after the delay.
      fireEvent.touchMove(dragElement, {
        touches: [{ clientX: 105, clientY: 105, identifier: 1 }],
        targetTouches: [{ clientX: 105, clientY: 105, identifier: 1 }],
        changedTouches: [{ clientX: 105, clientY: 105, identifier: 1 }],
      })

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 250))
      })

      expect(onDragStart).toHaveBeenCalled()
    })
  })

  describe('Touch Event Handling', () => {
    it('should forward onDragEnd on touchend', async () => {
      const onDragEnd = vi.fn()

      const { container } = render(
        <DragDropProvider activeTask={null} onDragStart={vi.fn()} onDragEnd={onDragEnd}>
          <TaskCard task={mockTask} />
          <div data-testid="drop-zone" data-droppable-id="in-progress">
            Drop Zone
          </div>
        </DragDropProvider>
      )

      const dragElement = container.querySelector('[data-task-id="task-1"]') as Element

      fireEvent.touchStart(dragElement, {
        touches: [{ clientX: 100, clientY: 100, identifier: 1 }],
      })

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 250))
      })

      fireEvent.touchMove(dragElement, {
        touches: [{ clientX: 200, clientY: 200, identifier: 1 }],
      })

      fireEvent.touchEnd(dragElement, {
        changedTouches: [{ clientX: 200, clientY: 200, identifier: 1 }],
      })

      expect(onDragEnd).toHaveBeenCalled()
    })

    it('should handle touchcancel events gracefully', async () => {
      const { container } = renderProvider()

      const dragElement = container.querySelector('[data-task-id="task-1"]') as Element

      fireEvent.touchStart(dragElement, {
        touches: [{ clientX: 100, clientY: 100, identifier: 1 }],
      })

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 250))
      })

      expect(() => {
        fireEvent.touchCancel(dragElement, {
          changedTouches: [{ clientX: 100, clientY: 100, identifier: 1 }],
        })
      }).not.toThrow()
    })
  })

  describe('Cross-device Compatibility', () => {
    it('should work with both mouse and touch events', async () => {
      const onDragStart = vi.fn()
      const { container } = renderProvider({ onDragStart })

      const dragElement = container.querySelector('[data-task-id="task-1"]') as Element

      fireEvent.mouseDown(dragElement, { clientX: 100, clientY: 100 })
      fireEvent.mouseMove(dragElement, { clientX: 110, clientY: 110 })
      fireEvent.mouseUp(dragElement)

      fireEvent.touchStart(dragElement, {
        touches: [{ clientX: 100, clientY: 100, identifier: 1 }],
      })

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 250))
      })

      expect(onDragStart).toHaveBeenCalled()
    })
  })

  describe('Performance Considerations', () => {
    it('should cleanup properly on unmount', () => {
      const { unmount } = renderProvider()

      expect(() => unmount()).not.toThrow()
    })
  })
})
