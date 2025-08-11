"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useSettingsStore } from "@/lib/stores/settingsStore";
import { Settings } from "@/lib/types";
import { confirmAndResetApplication } from "@/lib/utils/resetApp";
import { Palette, Monitor, Archive, Accessibility, Trash2 } from "lucide-react";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { settings, updateSettings, resetSettings } = useSettingsStore();
  const { theme, setTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [localSettings, setLocalSettings] = useState<Settings>(settings);

  // Sync settings when dialog opens or settings change
  useEffect(() => {
    setLocalSettings({
      ...settings,
      theme: (theme as Settings['theme']) || 'system'
    });
  }, [settings, theme, open]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Ensure next-themes is in sync with local settings
      if (localSettings.theme !== theme) {
        setTheme(localSettings.theme);
      }
      await updateSettings(localSettings);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    if (confirm('Are you sure you want to reset all settings to default?')) {
      setIsLoading(true);
      try {
        await resetSettings();
        setTheme('system'); // Reset theme in next-themes
        setLocalSettings(settings);
        onOpenChange(false);
      } catch (error) {
        console.error('Failed to reset settings:', error);
      } finally {
        setIsLoading(false);
      }
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Theme Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              <h3 className="text-lg font-medium">Appearance</h3>
            </div>
            
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <Select
                  value={localSettings.theme}
                  onValueChange={(value: Settings['theme']) => updateLocalSetting('theme', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Choose your preferred theme. Changes apply immediately and sync with the sidebar theme toggle.
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Task Management Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Archive className="h-5 w-5" />
              <h3 className="text-lg font-medium">Task Management</h3>
            </div>
            
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="autoArchive">Auto-archive completed tasks after</Label>
                <Select
                  value={localSettings.autoArchiveDays.toString()}
                  onValueChange={(value) => updateLocalSetting('autoArchiveDays', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 day</SelectItem>
                    <SelectItem value="7">1 week</SelectItem>
                    <SelectItem value="30">1 month</SelectItem>
                    <SelectItem value="90">3 months</SelectItem>
                    <SelectItem value="365">1 year</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Automatically move completed tasks to archive after the specified time
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notifications">Enable notifications</Label>
                  <p className="text-xs text-muted-foreground">
                    Show browser notifications for task reminders
                  </p>
                </div>
                <Switch
                  id="notifications"
                  checked={localSettings.enableNotifications}
                  onCheckedChange={(checked) => updateLocalSetting('enableNotifications', checked)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Accessibility Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Accessibility className="h-5 w-5" />
              <h3 className="text-lg font-medium">Accessibility</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="highContrast">High contrast mode</Label>
                  <p className="text-xs text-muted-foreground">
                    Increase contrast for better visibility
                  </p>
                </div>
                <Switch
                  id="highContrast"
                  checked={localSettings.accessibility.highContrast}
                  onCheckedChange={(checked) => updateAccessibilitySetting('highContrast', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="reduceMotion">Reduce motion</Label>
                  <p className="text-xs text-muted-foreground">
                    Minimize animations and transitions
                  </p>
                </div>
                <Switch
                  id="reduceMotion"
                  checked={localSettings.accessibility.reduceMotion}
                  onCheckedChange={(checked) => updateAccessibilitySetting('reduceMotion', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fontSize">Font size</Label>
                <Select
                  value={localSettings.accessibility.fontSize}
                  onValueChange={(value: Settings['accessibility']['fontSize']) => 
                    updateAccessibilitySetting('fontSize', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Developer Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              <h3 className="text-lg font-medium">Developer</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="debugMode">Debug mode</Label>
                  <p className="text-xs text-muted-foreground">
                    Enable additional logging and debugging features
                  </p>
                </div>
                <Switch
                  id="debugMode"
                  checked={localSettings.enableDebugMode}
                  onCheckedChange={(checked) => updateLocalSetting('enableDebugMode', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label>Reset Application</Label>
                <div className="space-y-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={confirmAndResetApplication}
                    className="w-full"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Reset App to Default
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Permanently deletes all data including boards, tasks, settings, and preferences. This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={isLoading}
            >
              Reset to Default
            </Button>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
