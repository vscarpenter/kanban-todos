"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { BoardView } from "./BoardView";
import { SearchBar } from "./SearchBar";
import { ClientOnly } from "./ClientOnly";
import { Button } from "@/components/ui/button";
import { Menu } from "@/lib/icons";
import { useTaskStore } from "@/lib/stores/taskStore";
import { useBoardStore } from "@/lib/stores/boardStore";
import { useSettingsStore } from "@/lib/stores/settingsStore";

export function KanbanBoard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [, setIsInitialized] = useState(false);
  const { initializeStore, setBoardFilter } = useTaskStore();
  const { initializeBoards, currentBoardId } = useBoardStore();
  const { initializeSettings } = useSettingsStore();

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
    </ClientOnly>
  );
}
