"use client";

import { Button } from "@/components/ui/button";
import { AlertCircle, Search } from "@/lib/icons";

interface EmptyStateProps {
  type: 'no-board' | 'loading' | 'error' | 'no-search-results' | 'no-board-results';
  searchQuery?: string;
  boardName?: string;
  error?: string;
  onClearSearch?: () => void;
  onRetry?: () => void;
}

export function EmptyState({
  type,
  searchQuery,
  boardName,
  error,
  onClearSearch,
  onRetry
}: EmptyStateProps) {
  const renderContent = () => {
    switch (type) {
      case 'no-board':
        return (
          <>
            <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-muted-foreground/20 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No Board Selected</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">Select a board from the sidebar to get started.</p>
          </>
        );

      case 'loading':
        return (
          <>
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Loading board...</p>
          </>
        );

      case 'error':
        return (
          <>
            <div className="w-20 h-20 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Error Loading Board</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto">{error}</p>
            <Button onClick={onRetry}>Retry</Button>
          </>
        );

      case 'no-search-results':
        return (
          <>
            <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-muted-foreground/20 flex items-center justify-center mx-auto mb-6">
              <Search className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No Results Found</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto">
              {searchQuery
                ? `No tasks matching "${searchQuery}" across all boards.`
                : "No tasks found across all boards with the current filters."
              }
            </p>
            <Button variant="outline" onClick={onClearSearch}>
              Clear Search
            </Button>
          </>
        );

      case 'no-board-results':
        return (
          <>
            <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-muted-foreground/20 flex items-center justify-center mx-auto mb-6">
              <Search className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No Results Found</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto">
              {searchQuery
                ? `No tasks matching "${searchQuery}" in ${boardName}.`
                : "No tasks found in this board with the current filters."
              }
            </p>
            <Button variant="outline" onClick={onClearSearch}>
              Clear Search
            </Button>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex items-center justify-center h-full board-animate-in">
      <div className="text-center px-6">
        {renderContent()}
      </div>
    </div>
  );
}