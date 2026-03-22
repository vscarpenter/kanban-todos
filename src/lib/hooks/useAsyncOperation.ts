"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";

interface UseAsyncOperationOptions {
  /** Toast message shown on success. If omitted, no success toast is shown. */
  successMessage?: string;
  /** Toast message shown on error. Falls back to the caught error's message. */
  errorMessage?: string;
}

interface UseAsyncOperationReturn<T> {
  execute: (operation: () => Promise<T>) => Promise<T | undefined>;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Manages loading state, error handling, and toast notifications for async operations.
 * Replaces the repeated useState(isLoading) + try/catch/finally pattern.
 */
export function useAsyncOperation<T = void>(
  options: UseAsyncOperationOptions = {}
): UseAsyncOperationReturn<T> {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(
    async (operation: () => Promise<T>): Promise<T | undefined> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await operation();

        if (options.successMessage) {
          toast.success(options.successMessage);
        }

        return result;
      } catch (caughtError) {
        const normalizedError =
          caughtError instanceof Error
            ? caughtError
            : new Error(String(caughtError));

        setError(normalizedError);

        toast.error(options.errorMessage ?? normalizedError.message);

        return undefined;
      } finally {
        setIsLoading(false);
      }
    },
    [options.successMessage, options.errorMessage]
  );

  return { execute, isLoading, error };
}
