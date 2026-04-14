"use client";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Settings } from "@/lib/types";
import { Palette, Monitor, Archive, Accessibility } from "lucide-react";

interface SettingSectionProps {
  localSettings: Settings;
  updateLocalSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
}

interface AccessibilitySectionProps extends SettingSectionProps {
  updateAccessibilitySetting: <K extends keyof Settings['accessibility']>(
    key: K,
    value: Settings['accessibility'][K]
  ) => void;
}

type DeveloperSectionProps = SettingSectionProps;

export function AppearanceSection({ localSettings, updateLocalSetting }: SettingSectionProps) {
  return (
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
  );
}

export function TaskManagementSection({ localSettings, updateLocalSetting }: SettingSectionProps) {
  return (
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
  );
}

export function AccessibilitySection({
  localSettings,
  updateAccessibilitySetting,
}: AccessibilitySectionProps) {
  return (
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
  );
}

export function DeveloperSection({
  localSettings,
  updateLocalSetting,
}: DeveloperSectionProps) {
  return (
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

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="developerMode">Developer mode</Label>
            <p className="text-xs text-muted-foreground">
              Show developer tools like monitoring and production readiness dashboards
            </p>
          </div>
          <Switch
            id="developerMode"
            checked={localSettings.enableDeveloperMode}
            onCheckedChange={(checked) => updateLocalSetting('enableDeveloperMode', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="keyboardShortcuts">Keyboard shortcuts</Label>
            <p className="text-xs text-muted-foreground">
              Enable keyboard shortcuts for faster navigation
            </p>
          </div>
          <Switch
            id="keyboardShortcuts"
            checked={localSettings.enableKeyboardShortcuts}
            onCheckedChange={(checked) => updateLocalSetting('enableKeyboardShortcuts', checked)}
          />
        </div>
      </div>
    </div>
  );
}
