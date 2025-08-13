import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useBoardStore } from '../boardStore'

// Mock the database
vi.mock('@/lib/utils/database', () => ({
  taskDB: {
    init: vi.fn().mockResolvedValue(undefined),
    addBoard: vi.fn().mockResolvedValue(undefined),
    getBoards: vi.fn().mockResolvedValue([]),
    updateBoard: vi.fn().mockResolvedValue(undefined),
    deleteBoard: vi.fn().mockResolvedValue(undefined),
  },
}))

describe('boardStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useBoardStore.setState({
      boards: [],
      currentBoardId: null,
      isLoading: false,
      error: null,
    })
  })

  it('initializes with empty state', () => {
    const { boards, currentBoardId, isLoading, error } = useBoardStore.getState()
    
    expect(boards).toEqual([])
    expect(currentBoardId).toBeNull()
    expect(isLoading).toBe(false)
    expect(error).toBeNull()
  })

  it('adds a new board', async () => {
    const { addBoard } = useBoardStore.getState()
    
    await addBoard({
      name: 'Test Board',
      color: '#3b82f6',
      description: 'Test description',
      isDefault: false
    })
    
    const { boards } = useBoardStore.getState()
    expect(boards).toHaveLength(1)
    expect(boards[0].name).toBe('Test Board')
    expect(boards[0].color).toBe('#3b82f6')
  })

  it('sets current board', () => {
    const { setCurrentBoard } = useBoardStore.getState()
    
    setCurrentBoard('board-123')
    
    const { currentBoardId } = useBoardStore.getState()
    expect(currentBoardId).toBe('board-123')
  })
})