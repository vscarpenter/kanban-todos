"use client";

import { useState } from "react";
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
  Upload
} from "lucide-react";
import { useBoardStore } from "@/lib/stores/boardStore";
import { useTaskStore } from "@/lib/stores/taskStore";
import { Board } from "@/lib/types";
import { CreateBoardDialog } from "./CreateBoardDialog";
import { SettingsDialog } from "./SettingsDialog";
import { UserGuideDialog } from "./UserGuideDialog";
import { ExportDialog } from "./ExportDialog";
import { ImportDialog } from "./ImportDialog";

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
  const { boards, currentBoardId, selectBoard } = useBoardStore();
  const { tasks } = useTaskStore();

  const getTaskCount = (boardId: string) => {
    return tasks.filter(task => task.boardId === boardId && !task.archivedAt).length;
  };

  const getTaskCountByStatus = (boardId: string, status: string) => {
    return tasks.filter(task => 
      task.boardId === boardId && 
      task.status === status && 
      !task.archivedAt
    ).length;
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
          md:translate-x-0
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

            <div className="space-y-2">
              {boards.map((board) => (
                <BoardItem
                  key={board.id}
                  board={board}
                  isActive={board.id === currentBoardId}
                  taskCount={getTaskCount(board.id)}
                  onSelect={() => selectBoard(board.id)}
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
              onClick={() => setShowExportDialog(true)}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => setShowImportDialog(true)}
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
              onClick={() => {/* TODO: Open archive */}}
            >
              <Archive className="h-4 w-4 mr-2" />
              Archive
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => {/* TODO: Open theme picker */}}
            >
              <Palette className="h-4 w-4 mr-2" />
              Theme
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <div className="text-xs text-muted-foreground text-center">
            Cascade v3.0.0
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
    </>
  );
}

interface BoardItemProps {
  board: Board;
  isActive: boolean;
  taskCount: number;
  onSelect: () => void;
}

function BoardItem({ board, isActive, taskCount, onSelect }: BoardItemProps) {
  return (
    <Card
      className={`
        cursor-pointer transition-all duration-200 hover:shadow-md
        ${isActive ? 'ring-2 ring-primary' : 'hover:ring-1 hover:ring-border'}
      `}
      onClick={onSelect}
    >
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <div 
            className="w-4 h-4 rounded-full flex-shrink-0"
            style={{ backgroundColor: board.color }}
          />
          <div className="flex-1 min-w-0">
            <div className="font-medium text-foreground truncate tracking-tight">
              {board.name}
            </div>
            {board.description && (
              <div className="text-xs text-muted-foreground truncate leading-relaxed">
                {board.description}
              </div>
            )}
          </div>
          <Badge variant="secondary" className="text-xs">
            {taskCount}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
