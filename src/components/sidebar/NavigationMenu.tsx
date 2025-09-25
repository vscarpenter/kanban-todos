"use client";

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Settings,
  Archive,
  Palette,
  HelpCircle,
  Download,
  Upload,
  Shield
} from "@/lib/icons";
import { useSettingsStore } from "@/lib/stores/settingsStore";

interface NavigationMenuProps {
  onExport: () => void;
  onImport: () => void;
  onSettings: () => void;
  onUserGuide: () => void;
  onArchive: () => void;
}

export function NavigationMenu({
  onExport,
  onImport,
  onSettings,
  onUserGuide,
  onArchive
}: NavigationMenuProps) {
  const { updateSettings } = useSettingsStore();
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    const themeOrder = ['light', 'dark', 'system'];
    const currentIndex = themeOrder.indexOf(theme || 'system');
    const nextIndex = (currentIndex + 1) % themeOrder.length;
    const nextTheme = themeOrder[nextIndex];

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
    <div className="space-y-2">
      <Button
        variant="ghost"
        className="w-full justify-start"
        onClick={onExport}
      >
        <Download className="h-4 w-4 mr-2" />
        Export Data
      </Button>
      <Button
        variant="ghost"
        className="w-full justify-start"
        onClick={onImport}
      >
        <Upload className="h-4 w-4 mr-2" />
        Import Data
      </Button>
      <Separator className="my-2" />
      <Button
        variant="ghost"
        className="w-full justify-start"
        onClick={onSettings}
      >
        <Settings className="h-4 w-4 mr-2" />
        Settings
      </Button>
      <Button
        variant="ghost"
        className="w-full justify-start"
        onClick={onUserGuide}
      >
        <HelpCircle className="h-4 w-4 mr-2" />
        User Guide
      </Button>
      <Button
        variant="ghost"
        className="w-full justify-start"
        onClick={onArchive}
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
  );
}