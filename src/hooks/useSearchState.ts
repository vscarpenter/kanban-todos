import { useState, useEffect, useRef } from "react";
import { TaskFilters } from "@/lib/types";
import { useTaskStore } from "@/lib/stores/taskStore";
import { useSettingsStore } from "@/lib/stores/settingsStore";

/**
 * Custom hook to manage search state and synchronization
 */
export function useSearchState() {
  const {
    filters,
    setFilters,
    setCrossBoardSearch,
    clearFilters,
    isSearching,
    error,
    tasks,
    filteredTasks
  } = useTaskStore();

  const { settings, updateSettings, isLoading: settingsLoading } = useSettingsStore();

  const [searchValue, setSearchValue] = useState(filters.search);
  const [localFilters, setLocalFilters] = useState<TaskFilters>(filters);
  const [isUserTyping, setIsUserTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync filters from store when user is not typing
  useEffect(() => {
    if (!isUserTyping) {
      setSearchValue(filters.search);
    }
    setLocalFilters(filters);
  }, [filters, isUserTyping]);

  // Initialize cross-board search from settings
  useEffect(() => {
    if (!settingsLoading && settings.searchPreferences?.rememberScope) {
      setCrossBoardSearch(settings.searchPreferences.defaultScope === 'all-boards');
    }
  }, [settings.searchPreferences, setCrossBoardSearch, settingsLoading]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleSearch = () => {
    setFilters({ ...localFilters, search: searchValue });
  };

  const handleFilterChange = (key: keyof TaskFilters, value: string | undefined) => {
    const filterValue = value === 'all' ? undefined : value;
    const newFilters = { ...localFilters, [key]: filterValue };
    setLocalFilters(newFilters);
    setFilters(newFilters);
  };

  const handleScopeToggle = async (enabled: boolean) => {
    setCrossBoardSearch(enabled);

    if (!settingsLoading && settings.searchPreferences?.rememberScope) {
      await updateSettings({
        searchPreferences: {
          ...settings.searchPreferences,
          defaultScope: enabled ? 'all-boards' : 'current-board'
        }
      });
    }
  };

  const handleClearFilters = () => {
    setIsUserTyping(false);
    clearFilters();
    setLocalFilters({
      search: '',
      tags: [],
      crossBoardSearch: filters.crossBoardSearch
    });
    setSearchValue('');
  };

  const handleSearchInputChange = (value: string) => {
    setIsUserTyping(true);
    setSearchValue(value);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsUserTyping(false);
    }, 1000);
  };

  const handleInputBlur = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    setIsUserTyping(false);
  };

  const hasActiveFilters = filters.search || filters.status || filters.priority || filters.tags.length > 0;
  const hasLargeDataset = tasks.length > 500;

  return {
    // State
    searchValue,
    localFilters,
    isUserTyping,
    filters,
    isSearching,
    error,
    tasks,
    filteredTasks,
    hasActiveFilters,
    hasLargeDataset,
    typingTimeoutRef,

    // Actions
    handleSearch,
    handleFilterChange,
    handleScopeToggle,
    handleClearFilters,
    handleSearchInputChange,
    handleInputBlur,
    setIsUserTyping,
    setSearchValue,
    setFilters,
    setLocalFilters,
  };
}
