"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "@/lib/icons";
import { SidebarHeader } from "./sidebar/SidebarHeader";
import { BoardsList } from "./sidebar/BoardsList";
import { NavigationMenu } from "./sidebar/NavigationMenu";
import { SidebarDialogs, type DialogType } from "./sidebar/SidebarDialogs";
import { VersionFooter } from "./VersionIndicator";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const [activeDialog, setActiveDialog] = useState<DialogType | null>(null);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={onToggle}
        aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
      >
        {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>

      <aside
        className={[
          "fixed md:relative inset-y-0 left-0 z-40",
          "transform transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "w-[280px] flex flex-col sidebar-glass",
        ].join(" ")}
        style={{
          background: "var(--paper-1)",
          borderRight: "1px solid var(--hairline-strong)",
        }}
      >
        <SidebarHeader onToggle={onToggle} />

        <div className="flex-1 overflow-y-auto px-3 pb-3">
          <BoardsList onCreateBoard={() => setActiveDialog("createBoard")} />
        </div>

        <div
          className="px-3 pt-3 pb-3 flex flex-col gap-2"
          style={{ borderTop: "1px solid var(--hairline)" }}
        >
          <NavigationMenu
            onExport={() => setActiveDialog("export")}
            onImport={() => setActiveDialog("import")}
            onSettings={() => setActiveDialog("settings")}
            onUserGuide={() => setActiveDialog("userGuide")}
            onArchive={() => setActiveDialog("archive")}
          />
          <VersionFooter />
        </div>
      </aside>

      <SidebarDialogs
        activeDialog={activeDialog}
        onDialogChange={setActiveDialog}
      />
    </>
  );
}
