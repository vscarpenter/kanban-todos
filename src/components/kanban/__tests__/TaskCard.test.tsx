import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import TaskCard from '../TaskCard'
import { Task } from '@/lib/types'

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

const mockProps = {
  task: mockTask,
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  onArchive: vi.fn(),
}

describe('TaskCard', () => {
  it('renders task title and description', () => {
    render(<TaskCard {...mockProps} />)
    
    expect(screen.getByText('Test Task')).toBeInTheDocument()
    expect(screen.getByText('Test description')).toBeInTheDocument()
  })

  it('shows priority badge correctly', () => {
    render(<TaskCard {...mockProps} />)
    
    expect(screen.getByText('medium')).toBeInTheDocument()
  })

  it('renders task tags', () => {
    render(<TaskCard {...mockProps} />)
    
    expect(screen.getByText('test')).toBeInTheDocument()
  })
})