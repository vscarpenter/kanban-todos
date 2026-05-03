"use client";

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
 * Editorial search input — paper-card surface, ⌘K chip on the right.
 * Icon left, mono shortcut chip right.
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
  onBlur,
}: SearchInputProps) {
  return (
    <div className="flex-1 max-w-[540px] relative">
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors"
        style={{
          background: "var(--paper-card)",
          border: `1px solid ${error ? "var(--danger-500)" : "var(--hairline-strong)"}`,
          boxShadow: "var(--shadow-xs)",
        }}
      >
        {isSearching ? (
          <Loader2 className="h-[15px] w-[15px] animate-spin" style={{ color: "var(--ink-4)" }} />
        ) : (
          <Search className="h-[15px] w-[15px]" style={{ color: "var(--ink-4)" }} />
        )}

        <input
          type="text"
          placeholder={filters.crossBoardSearch ? "Search across all boards…" : "Search tasks, tags, boards…"}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={onBlur}
          disabled={isSearching}
          aria-label={filters.crossBoardSearch ? "Search across all boards" : "Search tasks in current board"}
          aria-describedby={error ? "search-error" : filters.search ? "search-results" : undefined}
          role="searchbox"
          aria-autocomplete="list"
          className="flex-1 bg-transparent outline-none border-0 disabled:opacity-75"
          style={{
            fontSize: "13px",
            color: "var(--ink-1)",
            fontFamily: "var(--font-sans)",
          }}
        />

        <div className="flex items-center gap-1.5">
          {hasLargeDataset && (
            <div title={`Large dataset (${tasksLength} tasks) - searches may be slower`}>
              <AlertTriangle className="h-3.5 w-3.5" style={{ color: "var(--warn-500)" }} />
            </div>
          )}
          {filters.crossBoardSearch && !isSearching && (
            <div title="Searching across all boards">
              <Globe className="h-3.5 w-3.5" style={{ color: "var(--accent-500)" }} />
            </div>
          )}

          <kbd
            className="font-mono inline-flex items-center px-1.5 py-px rounded"
            style={{
              fontSize: "10.5px",
              color: "var(--ink-4)",
              background: "var(--paper-1)",
              border: "1px solid var(--hairline)",
              fontFeatureSettings: '"tnum"',
            }}
          >
            ⌘K
          </kbd>
        </div>
      </div>
    </div>
  );
}
