"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { useBoardStore } from "@/lib/stores/boardStore";
import { useSettingsStore } from "@/lib/stores/settingsStore";

/**
 * boardStore and settingsStore set `error` on failure but nothing ever read
 * it — task/board CRUD dialogs surface their own errors via
 * useAsyncOperation, but store-level failures with no dialog attached (e.g.
 * a failed board-selection persist, a failed settings write) were silently
 * dropped. Mount this once near the app root to toast on either.
 */
export function useStoreErrorToasts(): void {
  const boardError = useBoardStore((state) => state.error);
  const settingsError = useSettingsStore((state) => state.error);

  useEffect(() => {
    if (boardError) toast.error(boardError);
  }, [boardError]);

  useEffect(() => {
    if (settingsError) toast.error(settingsError);
  }, [settingsError]);
}
