"use client";

import {
  Settings,
  Archive,
  HelpCircle,
  Download,
  Upload,
  Shield,
  Info,
} from "@/lib/icons";

interface NavigationMenuProps {
  onExport: () => void;
  onImport: () => void;
  onSettings: () => void;
  onUserGuide: () => void;
  onArchive: () => void;
}

interface NavItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}

function NavItem({ icon: Icon, label, onClick }: NavItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-[var(--paper-2)]"
      style={{
        fontSize: "12.5px",
        fontWeight: 500,
        color: "var(--ink-2)",
      }}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </button>
  );
}

export function NavigationMenu({
  onExport,
  onImport,
  onSettings,
  onUserGuide,
  onArchive,
}: NavigationMenuProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <NavItem icon={Download} label="Export Data" onClick={onExport} />
      <NavItem icon={Upload} label="Import Data" onClick={onImport} />
      <NavItem icon={Archive} label="Archive" onClick={onArchive} />
      <NavItem icon={Settings} label="Settings" onClick={onSettings} />
      <NavItem icon={HelpCircle} label="User Guide" onClick={onUserGuide} />
      <NavItem icon={Shield} label="Privacy Policy" onClick={() => window.open("/privacy/", "_blank")} />
      <NavItem icon={Info} label="About Cascade" onClick={() => window.open("/about/", "_blank")} />
    </div>
  );
}
