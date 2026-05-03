"use client";

import { ChevronLeft } from "@/lib/icons";
import { Logo } from "@/components/Logo";

interface SidebarHeaderProps {
  onToggle: () => void;
}

export function SidebarHeader({ onToggle }: SidebarHeaderProps) {
  return (
    <div className="px-5 pt-[18px] pb-[18px] relative z-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo size={28} />
          <span
            className="font-serif text-[22px] leading-none"
            style={{ letterSpacing: "-0.02em", color: "var(--ink-1)" }}
          >
            Cascade
          </span>
        </div>
        <button
          type="button"
          onClick={onToggle}
          aria-label="Collapse sidebar"
          className="hidden md:inline-flex h-[26px] w-[26px] items-center justify-center rounded-md transition-colors"
          style={{
            border: "1px solid var(--hairline-strong)",
            color: "var(--ink-3)",
            background: "transparent",
          }}
        >
          <ChevronLeft className="h-[14px] w-[14px]" />
        </button>
      </div>
    </div>
  );
}
