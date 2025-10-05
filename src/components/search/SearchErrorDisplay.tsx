"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface SearchErrorDisplayProps {
  error: string;
  onClearSearch: () => void;
  onRetry: () => void;
}

/**
 * Displays search errors with recovery options
 */
export function SearchErrorDisplay({
  error,
  onClearSearch,
  onRetry
}: SearchErrorDisplayProps) {
  return (
    <div
      id="search-error"
      className="absolute top-full left-0 right-0 mt-1 p-3 bg-destructive/10 border border-destructive/20 rounded-md z-10"
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" aria-hidden="true" />
        <div className="flex-1">
          <p className="text-xs text-destructive font-medium mb-1">Search Error</p>
          <p className="text-xs text-destructive/80">{error}</p>
          <div className="flex gap-2 mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClearSearch}
              className="h-6 px-2 text-xs border-destructive/20 text-destructive hover:bg-destructive/10"
              aria-label="Clear search and recover from error"
            >
              Clear Search
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="h-6 px-2 text-xs border-destructive/20 text-destructive hover:bg-destructive/10"
              aria-label="Retry the search operation"
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
