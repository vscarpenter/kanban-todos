"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft } from "@/lib/icons";

interface SidebarHeaderProps {
  onToggle: () => void;
}

export function SidebarHeader({ onToggle }: SidebarHeaderProps) {
  return (
    <div className="p-6 border-b border-border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/cascade-icon.svg"
            alt="Cascade Logo"
            className="w-8 h-8"
          />
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">Cascade</h1>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="hidden md:flex"
          onClick={onToggle}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
        Task Management System
      </p>
    </div>
  );
}