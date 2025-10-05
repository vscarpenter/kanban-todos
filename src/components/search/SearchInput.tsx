"use client";

import { Input } from "@/components/ui/input";
import { Search, Loader2, AlertTriangle, Globe } from "lucide-react";

interface SearchInputProps {
  searchValue: string;
  isSearching: boolean;
  error: string | null;
  filters: {
    crossBoardSearch: boolean;
    search: string;
  };
  hasLargeDataset: boolean;
  tasksLength: number;
  onSearchChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onBlur: () => void;
}

/**
 * Search input field with loading, error states, and visual indicators
 */
export function SearchInput({
  searchValue,
  isSearching,
  error,
  filters,
  hasLargeDataset,
  tasksLength,
  onSearchChange,
  onKeyDown,
  onBlur
}: SearchInputProps) {
  return (
    <div className="flex-1 relative">
      {/* Left icon */}
      {isSearching ? (
        <Loader2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
      ) : (
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      )}

      {/* Right side icons */}
      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
        {hasLargeDataset && (
          <div title={`Large dataset (${tasksLength} tasks) - searches may be slower`}>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </div>
        )}
        {filters.crossBoardSearch && !isSearching && (
          <div title="Searching across all boards">
            <Globe className="h-4 w-4 text-primary" />
          </div>
        )}
      </div>

      <Input
        placeholder={filters.crossBoardSearch ? "Search across all boards..." : "Search tasks..."}
        value={searchValue}
        onChange={(e) => onSearchChange(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
        className={`pl-10 pr-12 ${error ? 'border-destructive' : ''} ${isSearching ? 'opacity-75' : ''}`}
        disabled={isSearching}
        aria-label={filters.crossBoardSearch ? "Search across all boards" : "Search tasks in current board"}
        aria-describedby={error ? "search-error" : filters.search ? "search-results" : undefined}
        role="searchbox"
        aria-autocomplete="list"
      />

      {/* Loading overlay */}
      {isSearching && (
        <div className="absolute inset-0 bg-background/50 rounded-md flex items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {filters.crossBoardSearch ? 'Searching all boards...' : 'Searching...'}
          </div>
        </div>
      )}
    </div>
  );
}
