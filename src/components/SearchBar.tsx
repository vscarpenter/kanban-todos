"use client";

import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
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
    if (e.key === 'Enter') {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      setIsUserTyping(false);
      handleSearch();
    } else if (e.key === 'Escape') {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      setIsUserTyping(false);
      setSearchValue('');
      handleClearFilters();
    }
  };

  const handleErrorClear = () => {
    setIsUserTyping(false);
    setSearchValue('');
    setFilters({ ...localFilters, search: '' });
    useTaskStore.getState().recoverFromSearchError();
  };

  const handleErrorRetry = () => {
    setIsUserTyping(false);
    useTaskStore.getState().setError(null);
    handleSearch();
  };

  return (
    <div className="border-b border-border bg-background p-4">
      <div className="flex items-center gap-4 max-w-4xl mx-auto">
        {/* Search Input */}
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

        {/* Error Display */}
        {error && (
          <SearchErrorDisplay
            error={error}
            onClearSearch={handleErrorClear}
            onRetry={handleErrorRetry}
          />
        )}

        {/* Results Summary */}
        {filters.search && !isSearching && !error && (
          <SearchResultsSummary
            resultsCount={filteredTasks.length}
            crossBoardSearch={filters.crossBoardSearch}
          />
        )}

        {/* Filter Popover */}
        <SearchFilterPopover
          filters={filters}
          localFilters={localFilters}
          hasActiveFilters={!!hasActiveFilters}
          onFilterChange={handleFilterChange}
          onScopeToggle={handleScopeToggle}
          onClearFilters={handleClearFilters}
        />

        {/* Search Button */}
        <Button
          onClick={handleSearch}
          size="sm"
          aria-label="Execute search"
          disabled={isSearching}
        >
          {isSearching ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
              Searching...
            </>
          ) : (
            'Search'
          )}
        </Button>
      </div>
    </div>
  );
}
