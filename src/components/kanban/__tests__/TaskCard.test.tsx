import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import TaskCard from '../TaskCard'
import { Task, Board } from '@/lib/types'

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

const mockBoard: Board = {
  id: 'board-2',
  name: 'Other Board',
  color: '#3b82f6',
  isDefault: false,
  order: 1,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

const mockCurrentBoard: Board = {
  id: 'board-1',
  name: 'Current Board',
  color: '#10b981',
  isDefault: true,
  order: 0,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

describe('TaskCard', () => {
  it('renders task title and description', () => {
    render(<TaskCard task={mockTask} />)
    
    expect(screen.getByText('Test Task')).toBeInTheDocument()
    expect(screen.getByText('Test description')).toBeInTheDocument()
  })

  it('shows priority badge correctly', () => {
    render(<TaskCard task={mockTask} />)
    
    expect(screen.getByText('medium')).toBeInTheDocument()
  })

  it('renders task tags', () => {
    render(<TaskCard task={mockTask} />)
    
    expect(screen.getByText('test')).toBeInTheDocument()
  })

  describe('Cross-board functionality', () => {
    it('does not show board indicator by default', () => {
      render(<TaskCard task={mockTask} />)
      
      expect(screen.queryByText('Other Board')).not.toBeInTheDocument()
    })

    it('shows board indicator when showBoardIndicator is true', () => {
      render(
        <TaskCard 
          task={mockTask} 
          showBoardIndicator={true}
          board={mockBoard}
          isCurrentBoard={false}
        />
      )
      
      expect(screen.getByText('Other Board')).toBeInTheDocument()
    })

    it('shows current board indicator with different styling', () => {
      render(
        <TaskCard 
          task={mockTask} 
          showBoardIndicator={true}
          board={mockCurrentBoard}
          isCurrentBoard={true}
        />
      )
      
      expect(screen.getByText('Current Board')).toBeInTheDocument()
    })

    it('calls onNavigateToBoard when clicking on task from other board', () => {
      const mockNavigate = vi.fn()
      
      render(
        <TaskCard 
          task={mockTask} 
          showBoardIndicator={true}
          board={mockBoard}
          isCurrentBoard={false}
          onNavigateToBoard={mockNavigate}
        />
      )
      
      const taskCard = screen.getByText('Test Task').closest('div')
      fireEvent.click(taskCard!)
      
      expect(mockNavigate).toHaveBeenCalledWith('board-2', 'task-1')
    })

    it('does not call onNavigateToBoard when clicking on current board task', () => {
      const mockNavigate = vi.fn()
      
      render(
        <TaskCard 
          task={mockTask} 
          showBoardIndicator={true}
          board={mockCurrentBoard}
          isCurrentBoard={true}
          onNavigateToBoard={mockNavigate}
        />
      )
      
      const taskCard = screen.getByText('Test Task').closest('div')
      fireEvent.click(taskCard!)
      
      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('does not call onNavigateToBoard when clicking on dropdown menu', () => {
      const mockNavigate = vi.fn()
      
      render(
        <TaskCard 
          task={mockTask} 
          showBoardIndicator={true}
          board={mockBoard}
          isCurrentBoard={false}
          onNavigateToBoard={mockNavigate}
        />
      )
      
      // Get the dropdown menu button (the one that's not the draggable container)
      const buttons = screen.getAllByRole('button')
      const menuButton = buttons.find(button => button.getAttribute('aria-haspopup') === 'menu')
      fireEvent.click(menuButton!)
      
      expect(mockNavigate).not.toHaveBeenCalled()
    })
  })
})