"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, Search } from "lucide-react";
import { useTaskStore } from "@/lib/stores/taskStore";

interface SearchErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface SearchErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{
    error: Error;
    resetError: () => void;
    recoverSearch: () => void;
  }>;
}

class SearchErrorBoundaryClass extends React.Component<
  SearchErrorBoundaryProps,
  SearchErrorBoundaryState
> {
  constructor(props: SearchErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): SearchErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Search Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Attempt to recover search functionality
    try {
      const { recoverFromSearchError } = useTaskStore.getState();
      recoverFromSearchError();
    } catch (recoveryError) {
      console.error('Failed to recover from search error:', recoveryError);
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  recoverSearch = () => {
    try {
      const { recoverFromSearchError } = useTaskStore.getState();
      recoverFromSearchError();
      this.resetError();
    } catch (error) {
      console.error('Search recovery failed:', error);
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={this.state.error!}
            resetError={this.resetError}
            recoverSearch={this.recoverSearch}
          />
        );
      }

      return (
        <DefaultSearchErrorFallback
          error={this.state.error!}
          resetError={this.resetError}
          recoverSearch={this.recoverSearch}
        />
      );
    }

    return this.props.children;
  }
}

interface DefaultSearchErrorFallbackProps {
  error: Error;
  resetError: () => void;
  recoverSearch: () => void;
}

function DefaultSearchErrorFallback({
  error,
  resetError,
  recoverSearch,
}: DefaultSearchErrorFallbackProps) {
  const isSearchRelated = error.message.toLowerCase().includes('search') ||
                         error.message.toLowerCase().includes('filter') ||
                         error.stack?.includes('searchTasks') ||
                         error.stack?.includes('applyFilters');

  return (
    <Card className="w-full max-w-md mx-auto mt-8 border-destructive/20">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <CardTitle className="text-destructive">
          {isSearchRelated ? 'Search Error' : 'Application Error'}
        </CardTitle>
        <CardDescription>
          {isSearchRelated
            ? 'An error occurred while searching tasks. This might be due to corrupted data or a temporary issue.'
            : 'An unexpected error occurred. The search functionality may be affected.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
          <strong>Error:</strong> {error.message}
        </div>
        
        <div className="flex flex-col gap-2">
          <Button onClick={recoverSearch} className="w-full">
            <Search className="h-4 w-4 mr-2" />
            Recover Search
          </Button>
          
          <Button onClick={resetError} variant="outline" className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="w-full"
          >
            Reload Page
          </Button>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer font-medium">
              Debug Information
            </summary>
            <pre className="mt-2 whitespace-pre-wrap bg-muted p-2 rounded text-xs overflow-auto max-h-32">
              {error.stack}
            </pre>
          </details>
        )}
      </CardContent>
    </Card>
  );
}

// Export the wrapper component
export function SearchErrorBoundary(props: SearchErrorBoundaryProps) {
  return <SearchErrorBoundaryClass {...props} />;
}

// Hook for handling search errors in functional components
export function useSearchErrorHandler() {
  const { error, setError, recoverFromSearchError } = useTaskStore();

  const handleSearchError = React.useCallback((error: Error) => {
    console.error('Search error handled:', error);
    setError(error.message);
  }, [setError]);

  const clearError = React.useCallback(() => {
    setError(null);
  }, [setError]);

  const recoverFromError = React.useCallback(() => {
    try {
      recoverFromSearchError();
      clearError();
    } catch (recoveryError) {
      console.error('Failed to recover from search error:', recoveryError);
      setError('Failed to recover from error. Please refresh the page.');
    }
  }, [recoverFromSearchError, clearError, setError]);

  return {
    error,
    handleSearchError,
    clearError,
    recoverFromError,
  };
}