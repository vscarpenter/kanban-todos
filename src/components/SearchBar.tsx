"use client";

import { useTaskStore } from "@/lib/stores/taskStore";
import { useSearchState } from "@/hooks/useSearchState";
import { SearchInput } from "./search/SearchInput";
import { SearchErrorDisplay } from "./search/SearchErrorDisplay";
import { SearchResultsSummary } from "./search/SearchResultsSummary";
import { SearchFilterPopover } from "./search/SearchFilterPopover";

export function SearchBar() {
  const {
    searchValue,
    localFilters,
    filters,
    isSearching,
    error,
    tasks,
    filteredTasks,
    hasActiveFilters,
    hasLargeDataset,
    typingTimeoutRef,
    handleSearch,
    handleFilterChange,
    handleScopeToggle,
    handleClearFilters,
    handleSearchInputChange,
    handleInputBlur,
    setIsUserTyping,
    setSearchValue,
    setFilters,
  } = useSearchState();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      setIsUserTyping(false);
      handleSearch();
    } else if (e.key === "Escape") {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      setIsUserTyping(false);
      setSearchValue("");
      handleClearFilters();
    }
  };

  const handleErrorClear = () => {
    setIsUserTyping(false);
    setSearchValue("");
    setFilters({ ...localFilters, search: "" });
    useTaskStore.getState().recoverFromSearchError();
  };

  const handleErrorRetry = () => {
    setIsUserTyping(false);
    useTaskStore.getState().setError(null);
    handleSearch();
  };

  return (
    <div
      className="px-4 py-4 sm:px-6"
      style={{ borderBottom: "1px solid var(--hairline)", background: "var(--paper-0)" }}
    >
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <SearchInput
          searchValue={searchValue}
          isSearching={isSearching}
          error={error}
          filters={filters}
          hasLargeDataset={hasLargeDataset}
          tasksLength={tasks.length}
          onSearchChange={handleSearchInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleInputBlur}
        />

        {error && (
          <SearchErrorDisplay
            error={error}
            onClearSearch={handleErrorClear}
            onRetry={handleErrorRetry}
          />
        )}

        {filters.search && !isSearching && !error && (
          <SearchResultsSummary
            resultsCount={filteredTasks.length}
            crossBoardSearch={filters.crossBoardSearch}
          />
        )}

        <div className="hidden flex-1 sm:block" />

        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleClearFilters}
            className="hidden min-h-10 items-center rounded-lg px-3 text-xs font-semibold transition-colors sm:inline-flex"
            style={{
              background: "var(--paper-card)",
              border: "1px solid var(--hairline-strong)",
              color: "var(--ink-3)",
            }}
          >
            Clear all
          </button>
        )}

        <SearchFilterPopover
          filters={filters}
          localFilters={localFilters}
          hasActiveFilters={!!hasActiveFilters}
          onFilterChange={handleFilterChange}
          onScopeToggle={handleScopeToggle}
          onClearFilters={handleClearFilters}
        />
      </div>
    </div>
  );
}
