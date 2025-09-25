"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Menu, X } from "@/lib/icons";
import { SidebarHeader } from "./sidebar/SidebarHeader";
import { BoardsList } from "./sidebar/BoardsList";
import { NavigationMenu } from "./sidebar/NavigationMenu";
import { SidebarDialogs } from "./sidebar/SidebarDialogs";
import { VersionFooter } from "./VersionIndicator";

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
        <SidebarHeader onToggle={onToggle} />

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <BoardsList onCreateBoard={() => setShowCreateBoard(true)} />

          <Separator />

          <NavigationMenu
            onExport={() => setShowExportDialog(true)}
            onImport={() => setShowImportDialog(true)}
            onSettings={() => setShowSettings(true)}
            onUserGuide={() => setShowUserGuide(true)}
            onArchive={() => setShowArchiveDialog(true)}
          />
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

      <SidebarDialogs
        showCreateBoard={showCreateBoard}
        onCreateBoardChange={setShowCreateBoard}
        showSettings={showSettings}
        onSettingsChange={setShowSettings}
        showUserGuide={showUserGuide}
        onUserGuideChange={setShowUserGuide}
        showExportDialog={showExportDialog}
        onExportDialogChange={setShowExportDialog}
        showImportDialog={showImportDialog}
        onImportDialogChange={setShowImportDialog}
        showArchiveDialog={showArchiveDialog}
        onArchiveDialogChange={setShowArchiveDialog}
      />
    </>
  );
}

