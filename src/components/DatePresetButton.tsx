"use client";

interface DatePresetButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

/**
 * Editorial date preset button used in TaskDialog's quick-pick row.
 *
 * Inactive: secondary chrome (paper-card, hairline-strong border, xs shadow).
 * Active: primary plum fill.
 *
 * Extracted from TaskDialog.tsx so the dialog stays under the file-size cap
 * and so this small visual unit can be unit-tested in isolation.
 */
export function DatePresetButton({ label, isActive, onClick }: DatePresetButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      className="inline-flex items-center justify-center rounded-md transition-colors"
      style={{
        padding: "8px 10px",
        fontSize: "12px",
        fontWeight: 600,
        ...(isActive
          ? {
              background: "var(--accent-500)",
              color: "var(--accent-ink)",
              border: "1px solid var(--accent-600)",
              boxShadow: "var(--shadow-sm)",
            }
          : {
              background: "var(--paper-card)",
              color: "var(--ink-2)",
              border: "1px solid var(--hairline-strong)",
              boxShadow: "var(--shadow-xs)",
            }),
      }}
    >
      {label}
    </button>
  );
}
