"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { Sidebar } from "./Sidebar";
import { BoardView } from "./BoardView";
import { SearchBar } from "./SearchBar";
import { ClientOnly } from "./ClientOnly";
import { Button } from "@/components/ui/button";
import { Menu } from "@/lib/icons";
import { useTaskStore } from "@/lib/stores/taskStore";
import { useBoardStore } from "@/lib/stores/boardStore";
import { useSettingsStore } from "@/lib/stores/settingsStore";
import { notificationManager } from "@/lib/utils/notifications";
import { detectTouchCapabilities } from "@/lib/utils/iosDetection";
import { logger } from "@/lib/utils/logger";
import { useStoreErrorToasts } from "@/lib/hooks/useStoreErrorToasts";
import { registerCascadeTools, unregisterCascadeTools } from "@/lib/webmcp";

// Lazy load keyboard components
const GlobalHotkeys = dynamic(() => import("./GlobalHotkeys").then(mod => ({ default: mod.GlobalHotkeys })), {
  loading: () => null
});
const KeyboardShortcutsDialog = dynamic(() => import("./KeyboardShortcutsDialog").then(mod => ({ default: mod.KeyboardShortcutsDialog })), {
  loading: () => null
});

// Loading fallback component - defined outside to prevent recreation on each render
function LoadingFallback() {
  return (
    <div className="flex h-screen bg-background">
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading application…</p>
        </div>
      </div>
    </div>
  );
}

export function KanbanBoard() {
  // Determine initial sidebar state based on device type
  const getInitialSidebarState = () => {
    // Only run on client side to avoid hydration mismatches
    if (typeof window === 'undefined') return true;
    
    const touchCapabilities = detectTouchCapabilities();
    // Start collapsed on mobile devices (phones), but open on tablets and desktop
    return !touchCapabilities.isLikelyMobile;
  };
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(getInitialSidebarState);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const { initializeStore, setBoardFilter, tasks, autoArchiveCompletedTasks } = useTaskStore();
  const { initializeBoards, currentBoardId } = useBoardStore();
  const { initializeSettings, settings } = useSettingsStore();

  useStoreErrorToasts();

  useEffect(() => {
    const initializeStores = async () => {
      try {
        await Promise.all([initializeSettings(), initializeBoards(), initializeStore()]);
        setIsInitialized(true);
      } catch (error) {
        logger.error('Failed to initialize stores', error);
        setIsInitialized(true);
      }
    };

    void initializeStores();
  }, [initializeStore, initializeBoards, initializeSettings]);

  // Expose the board to browser agents (WebMCP) once the data layer is
  // ready. The cleanup aborts the registration, which is what keeps strict
  // mode remounts and hot reloads clear of the duplicate-name rejection.
  useEffect(() => {
    if (!isInitialized) return;
    void registerCascadeTools();
    return () => unregisterCascadeTools();
  }, [isInitialized]);

  // Archive done tasks older than the setting. Runs once the data layer is
  // ready and again whenever the user changes the number of days.
  const autoArchiveDays = settings.autoArchiveDays;
  useEffect(() => {
    if (!isInitialized) return;
    autoArchiveCompletedTasks(autoArchiveDays)
      .then((archivedCount) => {
        if (archivedCount === 0) return;
        const noun = archivedCount === 1 ? 'task' : 'tasks';
        toast.info(`Archived ${archivedCount} completed ${noun} older than ${autoArchiveDays} days.`);
      })
      // The store records the error and BoardView shows it; log it here too.
      .catch((error: unknown) => logger.error('Auto-archive failed', error));
  }, [isInitialized, autoArchiveDays, autoArchiveCompletedTasks]);

  // Cross-store sync: task store's filter follows the selected board from board store.
  // Not derived state — it's a side effect into an external store.
  // react-doctor-disable-next-line react-doctor/no-derived-state-effect
  useEffect(() => {
    setBoardFilter(currentBoardId);
  }, [currentBoardId, setBoardFilter]);

  // Keep a ref to tasks so the notification system can read current tasks
  // without re-triggering the effect on every task change
  const tasksRef = useRef(tasks);
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  // Initialize notifications system — only re-run when the setting toggles
  const initNotifications = useCallback(async () => {
    const hasPermission = await notificationManager.requestPermission();
    if (hasPermission) {
      notificationManager.startPeriodicCheck(tasksRef.current);
    }
  }, []);

  useEffect(() => {
    if (!settings.enableNotifications) return;

    void initNotifications();

    return () => {
      notificationManager.stopPeriodicCheck();
    };
  }, [settings.enableNotifications, initNotifications]);

  // Listen for custom keyboard shortcut events
  useEffect(() => {
    const handleShowKeyboardShortcuts = () => setShowKeyboardShortcuts(true);
    
    document.addEventListener('show-keyboard-shortcuts', handleShowKeyboardShortcuts);
    
    return () => {
      document.removeEventListener('show-keyboard-shortcuts', handleShowKeyboardShortcuts);
    };
  }, []);

  return (
    <ClientOnly fallback={<LoadingFallback />}>
      <div className="flex h-screen bg-background">
        {/* Sidebar */}
        {isSidebarOpen && (
          <Sidebar 
            isOpen={isSidebarOpen} 
            onToggle={() => setIsSidebarOpen(!isSidebarOpen)} 
          />
        )}
        
        {/* Sidebar restore button - only show when sidebar is closed */}
        {!isSidebarOpen && (
          <Button
            variant="ghost"
            size="sm"
            className="fixed top-4 left-4 z-50 min-h-[45px] min-w-[45px] bg-background/80 backdrop-blur-sm border border-border shadow-lg"
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu className="h-4 w-4" aria-hidden="true" />
          </Button>
        )}
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Search Bar */}
          <SearchBar />
          
          {/* Board View */}
          <div className="flex-1 overflow-hidden">
            <BoardView />
          </div>
        </div>
      </div>
      
      {/* Global Hotkeys and Keyboard Shortcuts */}
      <GlobalHotkeys />
      <KeyboardShortcutsDialog
        open={showKeyboardShortcuts}
        onOpenChange={setShowKeyboardShortcuts}
      />
    </ClientOnly>
  );
}
