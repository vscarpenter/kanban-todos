"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
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

// Lazy load keyboard components
const GlobalHotkeys = dynamic(() => import("./GlobalHotkeys").then(mod => ({ default: mod.GlobalHotkeys })), {
  loading: () => null
});
const KeyboardShortcutsDialog = dynamic(() => import("./KeyboardShortcutsDialog").then(mod => ({ default: mod.KeyboardShortcutsDialog })), {
  loading: () => null
});

export function KanbanBoard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [, setIsInitialized] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const { initializeStore, setBoardFilter, tasks } = useTaskStore();
  const { initializeBoards, currentBoardId } = useBoardStore();
  const { initializeSettings, settings } = useSettingsStore();

  useEffect(() => {
    // Initialize stores sequentially for better performance
    const initializeStores = async () => {
      try {
        // Initialize settings first (needed for theme)
        await initializeSettings();
        // Initialize boards next (needed for board selection)  
        await initializeBoards();
        // Initialize task store last (can be deferred until board is selected)
        await initializeStore();
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize stores:', error);
        setIsInitialized(true); // Still show UI even if initialization fails
      }
    };

    initializeStores();
  }, [initializeStore, initializeBoards, initializeSettings]);

  // Update task filtering when current board changes
  useEffect(() => {
    setBoardFilter(currentBoardId);
  }, [currentBoardId, setBoardFilter]);

  // Initialize notifications system
  useEffect(() => {
    if (!settings.enableNotifications) return;

    const initializeNotifications = async () => {
      const hasPermission = await notificationManager.requestPermission();
      if (hasPermission) {
        notificationManager.startPeriodicCheck(tasks);
      }
    };

    initializeNotifications();

    return () => {
      notificationManager.stopPeriodicCheck();
    };
  }, [settings.enableNotifications, tasks]);

  // Listen for custom keyboard shortcut events
  useEffect(() => {
    const handleShowKeyboardShortcuts = () => setShowKeyboardShortcuts(true);
    
    document.addEventListener('show-keyboard-shortcuts', handleShowKeyboardShortcuts);
    
    return () => {
      document.removeEventListener('show-keyboard-shortcuts', handleShowKeyboardShortcuts);
    };
  }, []);

  const LoadingFallback = () => (
    <div className="flex h-screen bg-background">
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading application...</p>
        </div>
      </div>
    </div>
  );

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
            className="fixed top-4 left-4 z-50 bg-background/80 backdrop-blur-sm border border-border shadow-lg"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="h-4 w-4" />
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
