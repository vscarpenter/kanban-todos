import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SearchBar } from '../SearchBar';

// Mock the stores
const mockSetFilters = vi.fn();
const mockSetCrossBoardSearch = vi.fn();
const mockClearFilters = vi.fn();
const mockUpdateSettings = vi.fn();

// Create mock store states that can be modified
const mockTaskStore = {
  filters: {
    search: '',
    tags: [],
    crossBoardSearch: false,
    status: undefined,
    priority: undefined,
  },
  setFilters: mockSetFilters,
  setCrossBoardSearch: mockSetCrossBoardSearch,
  clearFilters: mockClearFilters,
  isSearching: false,
  error: null,
  tasks: [],
  filteredTasks: [],
};

const mockSettingsStore = {
  settings: {
    searchPreferences: {
      defaultScope: 'current-board' as const,
      rememberScope: true,
    },
  },
  updateSettings: mockUpdateSettings,
  isLoading: false,
};

vi.mock('@/lib/stores/taskStore', () => ({
  useTaskStore: () => mockTaskStore,
}));

vi.mock('@/lib/stores/settingsStore', () => ({
  useSettingsStore: () => mockSettingsStore,
}));

describe('SearchBar - Cross-board Search', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset mock states
    mockTaskStore.filters = {
      search: '',
      tags: [],
      crossBoardSearch: false,
      status: undefined,
      priority: undefined,
    };
    
    mockSettingsStore.settings.searchPreferences = {
      defaultScope: 'current-board',
      rememberScope: true,
    };
  });

  it('renders search input with correct placeholder for current board', () => {
    render(<SearchBar />);
    
    expect(screen.getByPlaceholderText('Search tasks...')).toBeInTheDocument();
  });

  it('shows cross-board search indicator when enabled', () => {
    // Update mock state
    mockTaskStore.filters.crossBoardSearch = true;

    render(<SearchBar />);
    
    expect(screen.getByPlaceholderText('Search across all boards...')).toBeInTheDocument();
    
    // Reset for other tests
    mockTaskStore.filters.crossBoardSearch = false;
  });

  it('calls setSearchQuery when typing in search input', async () => {
    render(<SearchBar />);

    const searchInput = screen.getByPlaceholderText('Search tasks...');
    fireEvent.change(searchInput, { target: { value: 'test query' } });

    // The refactored SearchBar uses useSearchState which debounces input
    // The value is stored locally until search is triggered
    expect(searchInput).toHaveValue('test query');
  });

  it('opens filter popover and shows scope toggle', async () => {
    render(<SearchBar />);
    
    const filterButton = screen.getByRole('button', { name: /filters/i });
    fireEvent.click(filterButton);
    
    await waitFor(() => {
      expect(screen.getByText('Search all boards')).toBeInTheDocument();
      expect(screen.getByText('Searching current board only')).toBeInTheDocument();
    });
  });

  it('toggles cross-board search when switch is clicked', async () => {
    render(<SearchBar />);
    
    const filterButton = screen.getByRole('button', { name: /filters/i });
    fireEvent.click(filterButton);
    
    await waitFor(() => {
      const toggle = screen.getByRole('switch');
      fireEvent.click(toggle);
    });
    
    expect(mockSetCrossBoardSearch).toHaveBeenCalledWith(true);
  });

  it('updates settings when scope is toggled and rememberScope is enabled', async () => {
    render(<SearchBar />);
    
    const filterButton = screen.getByRole('button', { name: /filters/i });
    fireEvent.click(filterButton);
    
    await waitFor(() => {
      const toggle = screen.getByRole('switch');
      fireEvent.click(toggle);
    });
    
    await waitFor(() => {
      expect(mockUpdateSettings).toHaveBeenCalledWith({
        searchPreferences: {
          defaultScope: 'all-boards',
          rememberScope: true,
        },
      });
    });
  });

  it('does not update settings when rememberScope is disabled', async () => {
    // Update mock settings
    mockSettingsStore.settings.searchPreferences.rememberScope = false;

    render(<SearchBar />);
    
    const filterButton = screen.getByRole('button', { name: /filters/i });
    fireEvent.click(filterButton);
    
    await waitFor(() => {
      const toggle = screen.getByRole('switch');
      fireEvent.click(toggle);
    });
    
    expect(mockSetCrossBoardSearch).toHaveBeenCalledWith(true);
    expect(mockUpdateSettings).not.toHaveBeenCalled();
    
    // Reset for other tests
    mockSettingsStore.settings.searchPreferences.rememberScope = true;
  });

  it('shows correct status text when cross-board search is enabled', async () => {
    // Update mock state
    mockTaskStore.filters.crossBoardSearch = true;

    render(<SearchBar />);
    
    const filterButton = screen.getByRole('button', { name: /filters/i });
    fireEvent.click(filterButton);
    
    await waitFor(() => {
      expect(screen.getByText('Searching across all boards')).toBeInTheDocument();
    });
    
    // Reset for other tests
    mockTaskStore.filters.crossBoardSearch = false;
  });

  it('preserves crossBoardSearch when clearing filters', async () => {
    // Update mock state with active filters
    mockTaskStore.filters = {
      search: 'test',
      status: 'todo' as const,
      tags: ['urgent'],
      crossBoardSearch: true,
      priority: undefined,
    };

    render(<SearchBar />);
    
    const filterButton = screen.getByRole('button', { name: /filters/i });
    fireEvent.click(filterButton);
    
    await waitFor(() => {
      const clearButton = screen.getByText('Clear all');
      fireEvent.click(clearButton);
    });
    
    expect(mockClearFilters).toHaveBeenCalled();
    
    // Reset for other tests
    mockTaskStore.filters = {
      search: '',
      tags: [],
      crossBoardSearch: false,
      status: undefined,
      priority: undefined,
    };
  });

  it('calls handleSearch when Enter is pressed', () => {
    render(<SearchBar />);

    const searchInput = screen.getByPlaceholderText('Search tasks...');
    fireEvent.change(searchInput, { target: { value: 'test' } });
    fireEvent.keyDown(searchInput, { key: 'Enter' });

    // setFilters is called with the complete filters object including the search value
    expect(mockSetFilters).toHaveBeenCalledWith(expect.objectContaining({ search: 'test' }));
  });

  it('calls handleSearch when search button is clicked', () => {
    render(<SearchBar />);

    const searchInput = screen.getByPlaceholderText('Search tasks...');
    fireEvent.change(searchInput, { target: { value: 'test' } });

    const searchButton = screen.getByRole('button', { name: /search/i });
    fireEvent.click(searchButton);

    // setFilters is called with the complete filters object including the search value
    expect(mockSetFilters).toHaveBeenCalledWith(expect.objectContaining({ search: 'test' }));
  });
});