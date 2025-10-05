"use client";

interface SearchResultsSummaryProps {
  resultsCount: number;
  crossBoardSearch: boolean;
}

/**
 * Displays search results count summary
 */
export function SearchResultsSummary({
  resultsCount,
  crossBoardSearch
}: SearchResultsSummaryProps) {
  return (
    <div
      id="search-results"
      className="absolute top-full left-0 right-0 mt-1 p-2 bg-muted/50 border border-border/50 rounded-md text-xs text-muted-foreground z-10"
      role="status"
      aria-live="polite"
    >
      Found {resultsCount} task{resultsCount !== 1 ? 's' : ''}
      {crossBoardSearch ? ' across all boards' : ' in current board'}
    </div>
  );
}
