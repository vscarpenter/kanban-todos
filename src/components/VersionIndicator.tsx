"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Info, ExternalLink, Sun, Moon, Monitor } from "@/lib/icons";
import { useSettingsStore } from "@/lib/stores/settingsStore";

interface VersionInfo {
  version: string;
  buildTime: string;
  buildHash: string;
}

function getVersionInfo(): VersionInfo {
  const version = process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0";
  const buildTime = process.env.NEXT_PUBLIC_BUILD_TIME || new Date().toISOString();
  const buildHash = process.env.NEXT_PUBLIC_BUILD_HASH || "dev";

  return {
    version,
    buildTime,
    buildHash: buildHash.slice(0, 7),
  };
}

/**
 * Compact, expandable version indicator (used inline in modals/headers).
 */
export function VersionIndicator() {
  const [versionInfo] = useState<VersionInfo>(getVersionInfo);
  const [isExpanded, setIsExpanded] = useState(false);

  const buildDate = new Date(versionInfo.buildTime).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Button
        variant="ghost"
        size="sm"
        className="h-6 px-2 text-xs hover:bg-muted/50"
        onClick={() => setIsExpanded(!isExpanded)}
        title={`Version ${versionInfo.version} • Built: ${buildDate} • Hash: ${versionInfo.buildHash}`}
      >
        <Badge variant="outline" className="text-xs">
          v{versionInfo.version}
        </Badge>
        <Info className="ml-1 h-3 w-3" />
      </Button>

      {isExpanded && (
        <div className="flex items-center gap-2 text-xs animate-in slide-in-from-left-2 duration-200">
          <span className="text-muted-foreground">•</span>
          <span>Built {buildDate}</span>
          <span className="text-muted-foreground">•</span>
          <code className="bg-muted px-1 py-0.5 rounded text-[10px] font-mono">
            {versionInfo.buildHash}
          </code>
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0 hover:bg-muted/50"
            onClick={() => setIsExpanded(false)}
            aria-label="Collapse version details"
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Sidebar footer card — version + build date on the left, theme toggle pill
 * (Sun / Moon, active state in paper-card with xs shadow) on the right.
 */
type ThemeMode = "light" | "dark" | "system";

export function VersionFooter() {
  const [versionInfo] = useState<VersionInfo>(getVersionInfo);
  const { updateSettings } = useSettingsStore();
  const { theme, setTheme } = useTheme();

  const buildDate = new Date(versionInfo.buildTime);
  const formattedDate = buildDate.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
  });
  const formattedYear = buildDate.getFullYear();

  // Highlight the user's stored choice (light / dark / system), not the
  // resolved value — otherwise users can't tell when "system" is active.
  const activeMode: ThemeMode =
    theme === "dark" || theme === "light" || theme === "system" ? theme : "system";

  const setMode = (mode: ThemeMode) => {
    setTheme(mode);
    updateSettings({ theme: mode });
  };

  return (
    <div
      className="flex items-center justify-between rounded-lg px-2.5 py-2.5"
      style={{
        background: "var(--paper-card)",
        border: "1px solid var(--hairline)",
      }}
    >
      <div className="flex flex-col leading-none">
        <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--ink-2)" }}>
          Cascade <span className="font-mono" style={{ fontFeatureSettings: '"tnum"' }}>v{versionInfo.version}</span>
        </span>
        <span
          className="font-mono mt-1"
          style={{ fontSize: "10.5px", color: "var(--ink-4)", fontFeatureSettings: '"tnum"' }}
        >
          {formattedDate} · {formattedYear}
        </span>
      </div>

      <div
        className="flex items-center gap-0.5 rounded-full p-0.5"
        style={{ background: "var(--paper-1)", border: "1px solid var(--hairline)" }}
      >
        <ThemePillButton
          label="Light theme"
          isActive={activeMode === "light"}
          onClick={() => setMode("light")}
          icon={<Sun className="h-3.5 w-3.5" />}
        />
        <ThemePillButton
          label="Dark theme"
          isActive={activeMode === "dark"}
          onClick={() => setMode("dark")}
          icon={<Moon className="h-3.5 w-3.5" />}
        />
        <ThemePillButton
          label="System theme"
          isActive={activeMode === "system"}
          onClick={() => setMode("system")}
          icon={<Monitor className="h-3.5 w-3.5" />}
        />
      </div>
    </div>
  );
}

interface ThemePillButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}

function ThemePillButton({ label, isActive, onClick, icon }: ThemePillButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={isActive}
      className="inline-flex h-[22px] w-[22px] items-center justify-center rounded-full transition-all"
      style={{
        background: isActive ? "var(--paper-card)" : "transparent",
        boxShadow: isActive ? "var(--shadow-xs)" : "none",
        color: isActive ? "var(--ink-1)" : "var(--ink-4)",
      }}
    >
      {icon}
    </button>
  );
}
