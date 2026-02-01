import { useState, useEffect, useRef, useMemo } from "react";
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
  const [isUserTyping, setIsUserTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevFiltersRef = useRef(filters);

  // Derive localFilters from store filters - always in sync
  const localFilters = useMemo(() => filters, [filters]);

  // Sync search value from store when user is not typing and filters changed
  useEffect(() => {
    if (!isUserTyping && prevFiltersRef.current.search !== filters.search) {
      // Defer state update to avoid synchronous setState in effect body
      queueMicrotask(() => setSearchValue(filters.search));
    }
    prevFiltersRef.current = filters;
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
  };
}
