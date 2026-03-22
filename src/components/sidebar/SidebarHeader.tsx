"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft } from "@/lib/icons";

interface SidebarHeaderProps {
  onToggle: () => void;
}

export function SidebarHeader({ onToggle }: SidebarHeaderProps) {
  return (
    <div className="p-6 border-b border-border relative z-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/cascade-icon.svg"
            alt="Cascade Logo"
            className="w-8 h-8"
          />
          <h1
            className="text-2xl font-bold tracking-tighter bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent"
          >
            Cascade
          </h1>
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
    </div>
  );
}