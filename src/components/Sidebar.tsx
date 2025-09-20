"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ChevronLeft, 
  Plus, 
  Settings, 
  Archive, 
  Palette,
  Menu,
  X,
  HelpCircle,
  Download,
  Upload,
  Shield,
  ChevronUp,
  ChevronDown
} from "@/lib/icons";
import { useBoardStore } from "@/lib/stores/boardStore";
import { useTaskStore } from "@/lib/stores/taskStore";
import { useSettingsStore } from "@/lib/stores/settingsStore";
import { Board } from "@/lib/types";
import { BoardMenu } from "./BoardMenu";
import { getIOSTouchClasses, needsIOSTouchOptimization } from "@/lib/utils/iosDetection";
import { VersionFooter } from "./VersionIndicator";

// Lazy load dialog components to reduce initial bundle size
const CreateBoardDialog = dynamic(() => import("./CreateBoardDialog").then(mod => ({ default: mod.CreateBoardDialog })), {
  loading: () => null
});
const SettingsDialog = dynamic(() => import("./SettingsDialog").then(mod => ({ default: mod.SettingsDialog })), {
  loading: () => null
});
const UserGuideDialog = dynamic(() => import("./UserGuideDialog").then(mod => ({ default: mod.UserGuideDialog })), {
  loading: () => null
});
const ExportDialog = dynamic(() => import("./ExportDialog").then(mod => ({ default: mod.ExportDialog })), {
  loading: () => null
});
const ImportDialog = dynamic(() => import("./ImportDialog").then(mod => ({ default: mod.ImportDialog })), {
  loading: () => null
});
const ArchiveDialog = dynamic(() => import("./ArchiveDialog").then(mod => ({ default: mod.ArchiveDialog })), {
  loading: () => null
});

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const [showCreateBoard, setShowCreateBoard] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showUserGuide, setShowUserGuide] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const { boards, currentBoardId, selectBoard, reorderBoard } = useBoardStore();
  const { tasks } = useTaskStore();
  const { updateSettings } = useSettingsStore();
  const { theme, setTheme } = useTheme();
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  // Listen for keyboard shortcut events
  useEffect(() => {
    const handleShowSettings = () => setShowSettings(true);
    const handleShowHelp = () => setShowUserGuide(true);
    
    document.addEventListener('show-settings-dialog', handleShowSettings);
    document.addEventListener('show-help-dialog', handleShowHelp);
    
    return () => {
      document.removeEventListener('show-settings-dialog', handleShowSettings);
      document.removeEventListener('show-help-dialog', handleShowHelp);
    };
  }, []);

  const getTaskCount = (boardId: string) => {
    return tasks.filter(task => task.boardId === boardId && !task.archivedAt).length;
  };

  const handleBoardSelect = (boardId: string) => {
    selectBoard(boardId);
  };

  const handleExportClick = () => {
    setShowExportDialog(true);
  };

  const handleImportClick = () => {
    setShowImportDialog(true);
  };

  const toggleTheme = () => {
    const themeOrder = ['light', 'dark', 'system'];
    const currentIndex = themeOrder.indexOf(theme || 'system');
    const nextIndex = (currentIndex + 1) % themeOrder.length;
    const nextTheme = themeOrder[nextIndex];
    
    // Update both next-themes and our settings store
    setTheme(nextTheme);
    updateSettings({ theme: nextTheme as 'light' | 'dark' | 'system' });
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return '☀️';
      case 'dark':
        return '🌙';
      case 'system':
        return '⚙️';
      default:
        return '🎨';
    }
  };



  return (
    <>
      {/* Mobile toggle button */}
      <Button
        variant="ghost"
        size="sm"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={onToggle}
      >
        {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>

      {/* Sidebar */}
      <div
        className={`
          fixed md:relative inset-y-0 left-0 z-40
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          w-80 bg-card border-r border-border
          flex flex-col
        `}
      >
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src="/images/cascade-icon.svg" 
                alt="Cascade Logo" 
                className="w-8 h-8"
              />
              <h1 className="text-2xl font-semibold text-foreground tracking-tight">Cascade</h1>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="hidden md:flex"
              onClick={onToggle}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
            Task Management System
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Boards Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-foreground tracking-tight">Boards</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCreateBoard(true)}
                className="h-8 w-8 p-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className={hasTouch ? 'space-y-0.5' : 'space-y-1'}>
              {boards.map((board, index) => (
                <BoardItem
                  key={board.id}
                  board={board}
                  isActive={board.id === currentBoardId}
                  taskCount={getTaskCount(board.id)}
                  onSelect={() => handleBoardSelect(board.id)}
                  onReorder={(direction) => reorderBoard(board.id, direction)}
                  canMoveUp={index > 0}
                  canMoveDown={index < boards.length - 1}
                />
              ))}
            </div>
          </div>

          <Separator />

          {/* Navigation */}
          <div className="space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={handleExportClick}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={handleImportClick}
            >
              <Upload className="h-4 w-4 mr-2" />
              Import Data
            </Button>
            <Separator className="my-2" />
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => setShowSettings(true)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => setShowUserGuide(true)}
            >
              <HelpCircle className="h-4 w-4 mr-2" />
              User Guide
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => setShowArchiveDialog(true)}
            >
              <Archive className="h-4 w-4 mr-2" />
              Archive
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => window.open('/privacy/', '_blank')}
            >
              <Shield className="h-4 w-4 mr-2" />
              Privacy Policy
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={toggleTheme}
            >
              <Palette className="h-4 w-4 mr-2" />
              <span className="flex items-center gap-2">
                Theme
                <span className="text-xs opacity-70">
                  {getThemeIcon()} {theme}
                </span>
              </span>
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <VersionFooter />
          <div className="text-xs text-muted-foreground text-center mt-2">
            <a 
              href="https://vinny.dev/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors underline"
            >
              vinny.dev
            </a>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <CreateBoardDialog
        open={showCreateBoard}
        onOpenChange={setShowCreateBoard}
      />
      
      <SettingsDialog
        open={showSettings}
        onOpenChange={setShowSettings}
      />
      
      <UserGuideDialog
        open={showUserGuide}
        onOpenChange={setShowUserGuide}
      />
      
      <ExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
      />
      
      <ImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
      />
      
      <ArchiveDialog
        open={showArchiveDialog}
        onOpenChange={setShowArchiveDialog}
      />
    </>
  );
}

interface BoardItemProps {
  board: Board;
  isActive: boolean;
  taskCount: number;
  onSelect: () => void;
  onReorder: (direction: 'up' | 'down') => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

function BoardItem({ board, isActive, taskCount, onSelect, onReorder, canMoveUp, canMoveDown }: BoardItemProps) {
  const iosTouchClasses = getIOSTouchClasses();
  const needsIOSOptimization = needsIOSTouchOptimization();
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  const handleReorder = (direction: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    onReorder(direction);
    
    // Enhanced haptic feedback for iOS devices
    if (needsIOSOptimization && 'vibrate' in navigator) {
      navigator.vibrate([30, 10, 15]); // Subtle feedback pattern for UI interaction
    }
  };

  return (
    <Card
      className={`
        group cursor-pointer transition-all duration-200 hover:shadow-md
        ${isActive ? 'ring-2 ring-primary' : 'hover:ring-1 hover:ring-border'}
      `}
      onClick={onSelect}
    >
      <CardContent className={`${hasTouch ? 'p-2 py-1.5' : 'p-2'}`}>
        <div className={`flex items-center ${hasTouch ? 'gap-1.5' : 'gap-2'}`}>
          <div 
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: board.color }}
          />
          <div className="flex-1 min-w-0">
            <div className="font-medium text-foreground truncate tracking-tight">
              {board.name}
            </div>
            {board.description && (
              <div className={`text-xs text-muted-foreground truncate ${hasTouch ? 'leading-tight mt-0.5' : 'leading-relaxed'}`}>
                {board.description}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            {/* Reorder buttons - Always visible on touch devices */}
            <div className={`flex flex-col ${hasTouch ? 'gap-0.5 opacity-100' : 'gap-1 opacity-0 group-hover:opacity-100'} transition-opacity ${iosTouchClasses.join(' ')}`}>
              <Button
                variant="ghost"
                size="sm"
                className={`
                  ${hasTouch ? 'h-8 w-8 min-h-8 min-w-8' : 'h-6 w-6'} 
                  p-0 touch-target touch-optimized
                  ${!canMoveUp ? 'opacity-40' : 'active:scale-95 transition-transform hover:bg-accent'}
                `}
                onClick={(e) => handleReorder('up', e)}
                disabled={!canMoveUp}
                aria-label={`Move ${board.name} up`}
                title={`Move ${board.name} up`}
              >
                <ChevronUp className={hasTouch ? 'h-5 w-5' : 'h-4 w-4'} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`
                  ${hasTouch ? 'h-8 w-8 min-h-8 min-w-8' : 'h-6 w-6'} 
                  p-0 touch-target touch-optimized
                  ${!canMoveDown ? 'opacity-40' : 'active:scale-95 transition-transform hover:bg-accent'}
                `}
                onClick={(e) => handleReorder('down', e)}
                disabled={!canMoveDown}
                aria-label={`Move ${board.name} down`}
                title={`Move ${board.name} down`}
              >
                <ChevronDown className={hasTouch ? 'h-5 w-5' : 'h-4 w-4'} />
              </Button>
            </div>
            <Badge variant="secondary" className="text-xs">
              {taskCount}
            </Badge>
            <BoardMenu board={board} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
