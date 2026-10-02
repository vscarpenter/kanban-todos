import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { KanbanBoard } from '@/components/KanbanBoard'

// Hoisted so the same mock function reference persists across every call to
// useTaskStore/useBoardStore/useSettingsStore, letting tests assert on it.
const mocks = vi.hoisted(() => ({
  initializeStore: vi.fn().mockResolvedValue(undefined),
  initializeBoards: vi.fn().mockResolvedValue(undefined),
  initializeSettings: vi.fn().mockResolvedValue(undefined),
  registerCascadeTools: vi.fn().mockResolvedValue('registered'),
  unregisterCascadeTools: vi.fn(),
  autoArchiveCompletedTasks: vi.fn().mockResolvedValue(0),
  toastInfo: vi.fn(),
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
    autoArchiveCompletedTasks: mocks.autoArchiveCompletedTasks,
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
      settings: { enableNotifications: false, autoArchiveDays: 30 },
      error: null,
    }
    return selector ? selector(state) : state
  },
}))

vi.mock('sonner', () => ({
  toast: { info: mocks.toastInfo, error: vi.fn(), success: vi.fn() },
}))

vi.mock('@/lib/webmcp', () => ({
  registerCascadeTools: mocks.registerCascadeTools,
  unregisterCascadeTools: mocks.unregisterCascadeTools,
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

  it('registers WebMCP tools only after the stores are ready', async () => {
    render(<KanbanBoard />)

    expect(mocks.registerCascadeTools).not.toHaveBeenCalled()
    await waitFor(() => {
      expect(mocks.registerCascadeTools).toHaveBeenCalledTimes(1)
    })
    expect(mocks.initializeStore).toHaveBeenCalledTimes(1)
  })

  it('unregisters WebMCP tools when it unmounts', async () => {
    const { unmount } = render(<KanbanBoard />)
    await waitFor(() => {
      expect(mocks.registerCascadeTools).toHaveBeenCalledTimes(1)
    })

    unmount()

    expect(mocks.unregisterCascadeTools).toHaveBeenCalledTimes(1)
  })

  it('initializes stores on mount', async () => {
    render(<KanbanBoard />)

    await waitFor(() => {
      expect(mocks.initializeSettings).toHaveBeenCalledTimes(1)
      expect(mocks.initializeBoards).toHaveBeenCalledTimes(1)
      expect(mocks.initializeStore).toHaveBeenCalledTimes(1)
    })
  })

  it('auto-archives with the configured number of days once the stores are ready', async () => {
    render(<KanbanBoard />)

    expect(mocks.autoArchiveCompletedTasks).not.toHaveBeenCalled()
    await waitFor(() => {
      expect(mocks.autoArchiveCompletedTasks).toHaveBeenCalledWith(30)
    })
  })

  it('tells the user how many tasks moved to the archive', async () => {
    mocks.autoArchiveCompletedTasks.mockResolvedValueOnce(2)

    render(<KanbanBoard />)

    await waitFor(() => {
      expect(mocks.toastInfo).toHaveBeenCalledWith(expect.stringContaining('2'))
    })
  })

  it('stays quiet when no task was old enough to archive', async () => {
    render(<KanbanBoard />)

    await waitFor(() => {
      expect(mocks.autoArchiveCompletedTasks).toHaveBeenCalled()
    })
    expect(mocks.toastInfo).not.toHaveBeenCalled()
  })

  it('keeps the board running when the auto-archive write fails', async () => {
    mocks.autoArchiveCompletedTasks.mockRejectedValueOnce(new Error('IndexedDB write failed'))

    render(<KanbanBoard />)

    await waitFor(() => {
      expect(mocks.autoArchiveCompletedTasks).toHaveBeenCalled()
    })
    expect(screen.getByTestId('board-view')).toBeInTheDocument()
    expect(mocks.toastInfo).not.toHaveBeenCalled()
  })
})
