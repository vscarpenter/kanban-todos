"use client";

import { Button } from "@/components/ui/button";
import { AlertCircle } from "@/lib/icons";

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
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No Board Selected</h3>
            <p className="text-muted-foreground">Please select a board from the sidebar to get started.</p>
          </>
        );

      case 'loading':
        return (
          <>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading board...</p>
          </>
        );

      case 'error':
        return (
          <>
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Error Loading Board</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={onRetry}>Retry</Button>
          </>
        );

      case 'no-search-results':
        return (
          <>
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No Results Found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery
                ? `No tasks found matching "${searchQuery}" across all boards.`
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
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No Results Found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery
                ? `No tasks found matching "${searchQuery}" in ${boardName}.`
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
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        {renderContent()}
      </div>
    </div>
  );
}