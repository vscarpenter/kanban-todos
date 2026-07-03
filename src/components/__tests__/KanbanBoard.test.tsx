import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { KanbanBoard } from '@/components/KanbanBoard'

// Hoisted so the same mock function reference persists across every call to
// useTaskStore/useBoardStore/useSettingsStore, letting tests assert on it.
const mocks = vi.hoisted(() => ({
  initializeStore: vi.fn().mockResolvedValue(undefined),
  initializeBoards: vi.fn().mockResolvedValue(undefined),
  initializeSettings: vi.fn().mockResolvedValue(undefined),
}))

// Mock all the dependencies
vi.mock('@/components/Sidebar', () => ({
  Sidebar: ({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) => (
    <div data-testid="sidebar" data-open={isOpen}>
      <button onClick={onToggle}>Toggle Sidebar</button>
    </div>
  ),
}))

vi.mock('@/components/BoardView', () => ({
  BoardView: () => <div data-testid="board-view">Board View</div>,
}))

vi.mock('@/components/SearchBar', () => ({
  SearchBar: () => <div data-testid="search-bar">Search Bar</div>,
}))

vi.mock('@/components/ClientOnly', () => ({
  ClientOnly: ({ children, fallback }: { children: React.ReactNode; fallback: React.ReactNode }) => (
    <div data-testid="client-only">{children || fallback}</div>
  ),
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, className, ...props }: React.ComponentProps<'button'>) => (
    <button onClick={onClick} className={className} {...props}>
      {children}
    </button>
  ),
}))

vi.mock('@/lib/icons', () => ({
  Menu: () => <svg data-testid="menu-icon" />,
}))

vi.mock('@/lib/stores/taskStore', () => ({
  useTaskStore: () => ({
    initializeStore: mocks.initializeStore,
    setBoardFilter: vi.fn(),
    tasks: [],
  }),
}))

vi.mock('@/lib/stores/boardStore', () => ({
  useBoardStore: (selector?: (state: Record<string, unknown>) => unknown) => {
    const state = {
      initializeBoards: mocks.initializeBoards,
      currentBoardId: 'board-1',
      error: null,
    }
    return selector ? selector(state) : state
  },
}))

vi.mock('@/lib/stores/settingsStore', () => ({
  useSettingsStore: (selector?: (state: Record<string, unknown>) => unknown) => {
    const state = {
      initializeSettings: mocks.initializeSettings,
      settings: { enableNotifications: false },
      error: null,
    }
    return selector ? selector(state) : state
  },
}))

vi.mock('@/lib/utils/notifications', () => ({
  notificationManager: {
    requestPermission: vi.fn().mockResolvedValue(false),
    startPeriodicCheck: vi.fn(),
    stopPeriodicCheck: vi.fn(),
  },
}))

vi.mock('@/lib/utils/iosDetection', () => ({
  detectTouchCapabilities: () => ({
    isLikelyMobile: false,
    hasTouch: false,
    isPrecisionPointer: true,
    hasHover: true,
    deviceType: 'desktop',
  }),
}))

describe('KanbanBoard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    render(<KanbanBoard />)
    expect(screen.getByTestId('client-only')).toBeInTheDocument()
  })

  it('renders BoardView component', () => {
    render(<KanbanBoard />)
    expect(screen.getByTestId('board-view')).toBeInTheDocument()
  })

  it('renders SearchBar component', () => {
    render(<KanbanBoard />)
    expect(screen.getByTestId('search-bar')).toBeInTheDocument()
  })

  it('shows sidebar when open', () => {
    render(<KanbanBoard />)
    expect(screen.getByTestId('sidebar')).toBeInTheDocument()
  })

  it('initializes stores on mount', async () => {
    render(<KanbanBoard />)

    await waitFor(() => {
      expect(mocks.initializeSettings).toHaveBeenCalledTimes(1)
      expect(mocks.initializeBoards).toHaveBeenCalledTimes(1)
      expect(mocks.initializeStore).toHaveBeenCalledTimes(1)
    })
  })
})
