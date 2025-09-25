"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";

// Lazy load dialog components
const CreateBoardDialog = dynamic(() => import("../CreateBoardDialog").then(mod => ({ default: mod.CreateBoardDialog })), {
  loading: () => null
});
const SettingsDialog = dynamic(() => import("../SettingsDialog").then(mod => ({ default: mod.SettingsDialog })), {
  loading: () => null
});
const UserGuideDialog = dynamic(() => import("../UserGuideDialog").then(mod => ({ default: mod.UserGuideDialog })), {
  loading: () => null
});
const ExportDialog = dynamic(() => import("../ExportDialog").then(mod => ({ default: mod.ExportDialog })), {
  loading: () => null
});
const ImportDialog = dynamic(() => import("../ImportDialog").then(mod => ({ default: mod.ImportDialog })), {
  loading: () => null
});
const ArchiveDialog = dynamic(() => import("../ArchiveDialog").then(mod => ({ default: mod.ArchiveDialog })), {
  loading: () => null
});

interface SidebarDialogsProps {
  showCreateBoard: boolean;
  onCreateBoardChange: (show: boolean) => void;
  showSettings: boolean;
  onSettingsChange: (show: boolean) => void;
  showUserGuide: boolean;
  onUserGuideChange: (show: boolean) => void;
  showExportDialog: boolean;
  onExportDialogChange: (show: boolean) => void;
  showImportDialog: boolean;
  onImportDialogChange: (show: boolean) => void;
  showArchiveDialog: boolean;
  onArchiveDialogChange: (show: boolean) => void;
}

export function SidebarDialogs({
  showCreateBoard,
  onCreateBoardChange,
  showSettings,
  onSettingsChange,
  showUserGuide,
  onUserGuideChange,
  showExportDialog,
  onExportDialogChange,
  showImportDialog,
  onImportDialogChange,
  showArchiveDialog,
  onArchiveDialogChange
}: SidebarDialogsProps) {
  // Listen for keyboard shortcut events
  useEffect(() => {
    const handleShowSettings = () => onSettingsChange(true);
    const handleShowHelp = () => onUserGuideChange(true);

    document.addEventListener('show-settings-dialog', handleShowSettings);
    document.addEventListener('show-help-dialog', handleShowHelp);

    return () => {
      document.removeEventListener('show-settings-dialog', handleShowSettings);
      document.removeEventListener('show-help-dialog', handleShowHelp);
    };
  }, [onSettingsChange, onUserGuideChange]);

  return (
    <>
      <CreateBoardDialog
        open={showCreateBoard}
        onOpenChange={onCreateBoardChange}
      />

      <SettingsDialog
        open={showSettings}
        onOpenChange={onSettingsChange}
      />

      <UserGuideDialog
        open={showUserGuide}
        onOpenChange={onUserGuideChange}
      />

      <ExportDialog
        open={showExportDialog}
        onOpenChange={onExportDialogChange}
      />

      <ImportDialog
        open={showImportDialog}
        onOpenChange={onImportDialogChange}
      />

      <ArchiveDialog
        open={showArchiveDialog}
        onOpenChange={onArchiveDialogChange}
      />
    </>
  );
}