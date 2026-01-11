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

export type DialogType = 'createBoard' | 'settings' | 'userGuide' | 'export' | 'import' | 'archive';

interface SidebarDialogsProps {
  activeDialog: DialogType | null;
  onDialogChange: (dialog: DialogType | null) => void;
}

export function SidebarDialogs({ activeDialog, onDialogChange }: SidebarDialogsProps) {
  // Listen for keyboard shortcut events
  useEffect(() => {
    const handleShowSettings = () => onDialogChange('settings');
    const handleShowHelp = () => onDialogChange('userGuide');

    document.addEventListener('show-settings-dialog', handleShowSettings);
    document.addEventListener('show-help-dialog', handleShowHelp);

    return () => {
      document.removeEventListener('show-settings-dialog', handleShowSettings);
      document.removeEventListener('show-help-dialog', handleShowHelp);
    };
  }, [onDialogChange]);

  // Helper to create open change handler for each dialog
  const createOpenChangeHandler = (dialogType: DialogType) => (open: boolean) => {
    onDialogChange(open ? dialogType : null);
  };

  return (
    <>
      <CreateBoardDialog
        open={activeDialog === 'createBoard'}
        onOpenChange={createOpenChangeHandler('createBoard')}
      />

      <SettingsDialog
        open={activeDialog === 'settings'}
        onOpenChange={createOpenChangeHandler('settings')}
      />

      <UserGuideDialog
        open={activeDialog === 'userGuide'}
        onOpenChange={createOpenChangeHandler('userGuide')}
      />

      <ExportDialog
        open={activeDialog === 'export'}
        onOpenChange={createOpenChangeHandler('export')}
      />

      <ImportDialog
        open={activeDialog === 'import'}
        onOpenChange={createOpenChangeHandler('import')}
      />

      <ArchiveDialog
        open={activeDialog === 'archive'}
        onOpenChange={createOpenChangeHandler('archive')}
      />
    </>
  );
}
