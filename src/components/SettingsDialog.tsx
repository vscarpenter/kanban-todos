"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "next-themes";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useSettingsStore } from "@/lib/stores/settingsStore";
import { useAsyncOperation } from "@/lib/hooks/useAsyncOperation";
import { Settings } from "@/lib/types";
import { ConfirmationDialog } from "./ConfirmationDialog";
import { AppResetDialog } from "./AppResetDialog";
import { resetApplication } from "@/lib/utils/resetApp";
import {
  AppearanceSection,
  TaskManagementSection,
  AccessibilitySection,
  DeveloperSection,
} from "./SettingsSections";

// Deep compare settings objects
function settingsEqual(a: Settings, b: Settings): boolean {
  return (
    a.theme === b.theme &&
    a.autoArchiveDays === b.autoArchiveDays &&
    a.enableNotifications === b.enableNotifications &&
    a.enableKeyboardShortcuts === b.enableKeyboardShortcuts &&
    a.enableDebugMode === b.enableDebugMode &&
    a.enableDeveloperMode === b.enableDeveloperMode &&
    a.accessibility.highContrast === b.accessibility.highContrast &&
    a.accessibility.reduceMotion === b.accessibility.reduceMotion &&
    a.accessibility.fontSize === b.accessibility.fontSize
  );
}

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { settings, updateSettings, resetSettings } = useSettingsStore();
  const { theme, setTheme } = useTheme();
  const { execute, isLoading } = useAsyncOperation({
    errorMessage: "Failed to save settings",
  });
  const [localSettings, setLocalSettings] = useState<Settings>(settings);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showAppResetDialog, setShowAppResetDialog] = useState(false);
  const [isAppResetting, setIsAppResetting] = useState(false);
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);

  // Store initial settings when dialog opens
  const initialSettingsRef = useRef<Settings | null>(null);

  // Sync settings when dialog opens or settings change
  useEffect(() => {
    const currentSettings = {
      ...settings,
      theme: (theme as Settings['theme']) || 'system'
    };
    setLocalSettings(currentSettings);

    // Only capture initial settings when dialog opens
    if (open && !initialSettingsRef.current) {
      initialSettingsRef.current = currentSettings;
    }
    // Reset initial ref when dialog closes
    if (!open) {
      initialSettingsRef.current = null;
    }
  }, [settings, theme, open]);

  // Check if there are unsaved changes
  const hasUnsavedChanges = useCallback((): boolean => {
    if (!initialSettingsRef.current) return false;
    return !settingsEqual(localSettings, initialSettingsRef.current);
  }, [localSettings]);

  // Handle dialog close with unsaved changes check
  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (!newOpen && hasUnsavedChanges()) {
      setShowUnsavedChangesDialog(true);
      return;
    }
    onOpenChange(newOpen);
  }, [hasUnsavedChanges, onOpenChange]);

  // Discard changes and close (revert theme if changed)
  const handleDiscardChanges = useCallback(() => {
    // Revert theme to initial value if it was changed
    if (initialSettingsRef.current && localSettings.theme !== initialSettingsRef.current.theme) {
      setTheme(initialSettingsRef.current.theme);
    }
    setShowUnsavedChangesDialog(false);
    onOpenChange(false);
  }, [localSettings.theme, onOpenChange, setTheme]);

  const handleSave = async () => {
    const result = await execute(async () => {
      // Ensure next-themes is in sync with local settings
      if (localSettings.theme !== theme) {
        setTheme(localSettings.theme);
      }
      await updateSettings(localSettings);
    });

    // Only close dialog on success
    if (result !== undefined) {
      onOpenChange(false);
    }
  };

  const handleResetConfirm = async () => {
    const result = await execute(async () => {
      await resetSettings();
      setTheme('system'); // Reset theme in next-themes
      setLocalSettings(settings);
    });

    // Only close dialog on success
    if (result !== undefined) {
      onOpenChange(false);
    }
  };

  const handleAppResetConfirm = async () => {
    setIsAppResetting(true);
    try {
      // Note: resetApplication() will reload the page, so we don't need to close dialogs
      await resetApplication();
    } catch (error) {
      console.error('Failed to reset application:', error);
      const { toast } = await import("sonner");
      toast.error("Failed to reset application");
      // Only reset loading state if we didn't reload the page
      setIsAppResetting(false);
    }
  };

  const updateLocalSetting = <K extends keyof Settings>(
    key: K,
    value: Settings[K]
  ) => {
    if (key === 'theme') {
      // For theme changes, update next-themes immediately
      setTheme(value as string);
    }
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  const updateAccessibilitySetting = <K extends keyof Settings['accessibility']>(
    key: K,
    value: Settings['accessibility'][K]
  ) => {
    setLocalSettings(prev => ({
      ...prev,
      accessibility: { ...prev.accessibility, [key]: value }
    }));
  };

  return (
    <>
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Main Settings Groups */}
          <AppearanceSection
            localSettings={localSettings}
            updateLocalSetting={updateLocalSetting}
          />

          <Separator />

          <TaskManagementSection
            localSettings={localSettings}
            updateLocalSetting={updateLocalSetting}
          />

          <Separator />

          <AccessibilitySection
            localSettings={localSettings}
            updateLocalSetting={updateLocalSetting}
            updateAccessibilitySetting={updateAccessibilitySetting}
          />

          <Separator />

          {/* Advanced (Collapsible) */}
          <details className="group">
            <summary className="cursor-pointer flex items-center gap-2 text-lg font-medium hover:text-foreground text-muted">
              <span className="transform transition-transform group-open:rotate-90">▶</span>
              Advanced
            </summary>
            <div className="mt-4 pl-6 space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="debugMode">Debug mode</Label>
                    <p className="text-xs text-muted">
                      Enable additional logging and debugging features
                    </p>
                  </div>
                  <Switch
                    id="debugMode"
                    checked={localSettings.enableDebugMode}
                    onCheckedChange={(checked) => updateLocalSetting('enableDebugMode', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="developerMode">Developer mode</Label>
                    <p className="text-xs text-muted">
                      Show developer tools like monitoring and production readiness dashboards
                    </p>
                  </div>
                  <Switch
                    id="developerMode"
                    checked={localSettings.enableDeveloperMode}
                    onCheckedChange={(checked) => updateLocalSetting('enableDeveloperMode', checked)}
                  />
                </div>
              </div>
            </div>
          </details>

          <Separator />

          {/* Danger Zone */}
          <div className="bg-danger/5 border border-danger/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 bg-danger rounded-full"></div>
              <h3 className="text-lg font-medium text-danger">Danger Zone</h3>
            </div>
            <div className="space-y-3">
              <div>
                <Button
                  variant="outline"
                  onClick={() => setShowResetConfirm(true)}
                  disabled={isLoading}
                  className="w-full border-warning text-warning hover:bg-warning/10"
                >
                  Reset Settings to Default
                </Button>
                <p className="text-xs text-muted mt-1">
                  Restores all settings to their original values. Your data remains intact.
                </p>
              </div>
              
              <div>
                <Button
                  variant="destructive"
                  onClick={() => setShowAppResetDialog(true)}
                  disabled={isLoading}
                  className="w-full"
                >
                  Reset App to Default
                </Button>
                <p className="text-xs text-danger mt-1">
                  Permanently deletes all data including boards, tasks, and settings. This cannot be undone. Consider exporting your data first.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Reset Confirmation Dialog */}
      <ConfirmationDialog
        open={showResetConfirm}
        onOpenChange={setShowResetConfirm}
        title="Reset Settings"
        description="Are you sure you want to reset all settings to default? This will restore all preferences to their original values."
        confirmText="Reset"
        type="warning"
        onConfirm={handleResetConfirm}
        loading={isLoading}
      />

      {/* App Reset Dialog */}
      <AppResetDialog
        open={showAppResetDialog}
        onOpenChange={setShowAppResetDialog}
        onConfirm={handleAppResetConfirm}
        loading={isAppResetting}
      />
    </Dialog>

    {/* Unsaved Changes Confirmation */}
    <ConfirmationDialog
      open={showUnsavedChangesDialog}
      onOpenChange={setShowUnsavedChangesDialog}
      title="Unsaved Changes"
      description="You have unsaved settings changes. Are you sure you want to discard them? Any theme changes will be reverted."
      confirmText="Discard"
      cancelText="Keep Editing"
      type="warning"
      onConfirm={handleDiscardChanges}
    />
    </>
  );
}
