"use client";

import { Label } from "@/components/ui/label";
import {
  BOARD_ICONS,
  DOT_COLORS,
  type BoardIconKey,
  type DotColorKey,
} from "@/lib/utils/boardIcons";

interface BoardAppearancePickerProps {
  iconKey: BoardIconKey;
  dotColor: DotColorKey;
  onIconChange: (key: BoardIconKey) => void;
  onDotChange: (key: DotColorKey) => void;
}

export function BoardAppearancePicker({
  iconKey,
  dotColor,
  onIconChange,
  onDotChange,
}: BoardAppearancePickerProps) {
  return (
    <>
      <div className="space-y-2">
        <Label>Icon</Label>
        <div className="grid grid-cols-6 gap-2">
          {BOARD_ICONS.map(({ key, label, icon: Icon }) => {
            const selected = key === iconKey;
            return (
              <button
                key={key}
                type="button"
                aria-label={label}
                aria-pressed={selected}
                title={label}
                onClick={() => onIconChange(key)}
                className={[
                  "flex h-10 w-10 items-center justify-center rounded-md border transition-all",
                  selected
                    ? "border-[var(--hairline-strong)] bg-[var(--paper-card)] shadow-[var(--shadow-xs)]"
                    : "border-[var(--hairline)] bg-[var(--paper-1)] hover:bg-[var(--paper-2)]",
                ].join(" ")}
              >
                <Icon
                  size={16}
                  strokeWidth={1.8}
                  style={{
                    color: selected
                      ? "var(--accent-500)"
                      : "var(--ink-3)",
                  }}
                />
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Accent dot</Label>
        <div className="flex flex-wrap gap-2">
          {DOT_COLORS.map(({ key, label, cssVar }) => {
            const selected = key === dotColor;
            return (
              <button
                key={key}
                type="button"
                aria-label={label}
                aria-pressed={selected}
                title={label}
                onClick={() => onDotChange(key)}
                className={[
                  "flex h-8 w-8 items-center justify-center rounded-full border transition-all",
                  selected
                    ? "border-[var(--hairline-strong)] scale-110 shadow-[var(--shadow-xs)]"
                    : "border-[var(--hairline)] hover:scale-105",
                ].join(" ")}
              >
                <span
                  className="block h-3 w-3 rounded-full"
                  style={{ background: `var(${cssVar})` }}
                />
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
