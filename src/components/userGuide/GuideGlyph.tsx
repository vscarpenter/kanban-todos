"use client";

import type { ComponentType } from "react";

/**
 * Small inline glyph used in guide step badges.
 */
export function GuideGlyph({ icon: Icon }: { icon: ComponentType<{ className?: string }> }) {
  return <Icon className="h-3 w-3" />;
}
