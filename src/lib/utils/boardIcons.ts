import {
  Layers,
  Briefcase,
  Rocket,
  Megaphone,
  Home,
  Sprout,
  BookOpen,
  Code2,
  Palette,
  Flag,
  Sparkles,
  Tag,
  type LucideIcon,
} from 'lucide-react';

/**
 * Curated icon set for boards. Storing the string key (not the component)
 * keeps board records portable across exports and decoupled from lucide-react.
 */
export const BOARD_ICONS = [
  { key: 'Layers', label: 'Layers', icon: Layers },
  { key: 'Briefcase', label: 'Work', icon: Briefcase },
  { key: 'Rocket', label: 'Launch', icon: Rocket },
  { key: 'Megaphone', label: 'Marketing', icon: Megaphone },
  { key: 'Home', label: 'Home', icon: Home },
  { key: 'Sprout', label: 'Side project', icon: Sprout },
  { key: 'BookOpen', label: 'Learning', icon: BookOpen },
  { key: 'Code2', label: 'Code', icon: Code2 },
  { key: 'Palette', label: 'Design', icon: Palette },
  { key: 'Flag', label: 'Goals', icon: Flag },
  { key: 'Sparkles', label: 'Ideas', icon: Sparkles },
  { key: 'Tag', label: 'Tagged', icon: Tag },
] as const satisfies ReadonlyArray<{ key: string; label: string; icon: LucideIcon }>;

export type BoardIconKey = (typeof BOARD_ICONS)[number]['key'];

const ICON_BY_KEY: Record<string, LucideIcon> = Object.fromEntries(
  BOARD_ICONS.map(({ key, icon }) => [key, icon])
);

export function getBoardIcon(iconKey: string | undefined): LucideIcon {
  if (iconKey && ICON_BY_KEY[iconKey]) return ICON_BY_KEY[iconKey];
  return Layers;
}

/**
 * Per-board accent dot palette. Stored value is the token suffix
 * (e.g. "plum"); rendered value is `var(--dot-plum)`.
 */
export const DOT_COLORS = [
  { key: 'blue',  label: 'Blue',  cssVar: '--dot-blue',  hex: '#3F627A' },
  { key: 'amber', label: 'Amber', cssVar: '--dot-amber', hex: '#B07820' },
  { key: 'green', label: 'Green', cssVar: '--dot-green', hex: '#4F7A4B' },
  { key: 'rose',  label: 'Rose',  cssVar: '--dot-rose',  hex: '#A8412A' },
  { key: 'plum',  label: 'Plum',  cssVar: '--dot-plum',  hex: '#6B4A87' },
  { key: 'clay',  label: 'Clay',  cssVar: '--dot-clay',  hex: '#9A6240' },
  { key: 'moss',  label: 'Moss',  cssVar: '--dot-moss',  hex: '#5C6B3C' },
] as const;

export type DotColorKey = (typeof DOT_COLORS)[number]['key'];

const DOT_BY_KEY: Record<string, (typeof DOT_COLORS)[number]> = Object.fromEntries(
  DOT_COLORS.map((d) => [d.key, d])
);

export function getDotCssVar(dotColor: string | undefined): string {
  const dot = dotColor ? DOT_BY_KEY[dotColor] : undefined;
  return dot ? `var(${dot.cssVar})` : 'var(--dot-plum)';
}

export function getDotHex(dotColor: string | undefined): string {
  const dot = dotColor ? DOT_BY_KEY[dotColor] : undefined;
  return dot ? dot.hex : '#6B4A87';
}

/**
 * Maps a legacy hex color (from existing boards) to the closest dot key.
 * Uses simple RGB-distance to the dot palette.
 */
export function legacyColorToDot(legacyColor: string | undefined): DotColorKey {
  if (!legacyColor) return 'plum';

  const target = parseHex(legacyColor);
  if (!target) return 'plum';

  let best: DotColorKey = 'plum';
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const dot of DOT_COLORS) {
    const candidate = parseHex(dot.hex);
    if (!candidate) continue;

    const dr = target.r - candidate.r;
    const dg = target.g - candidate.g;
    const db = target.b - candidate.b;
    const distance = dr * dr + dg * dg + db * db;

    if (distance < bestDistance) {
      bestDistance = distance;
      best = dot.key;
    }
  }

  return best;
}

function parseHex(hex: string): { r: number; g: number; b: number } | null {
  const cleaned = hex.replace('#', '').trim();
  if (cleaned.length !== 6) return null;
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
  return { r, g, b };
}

export const DEFAULT_ICON_KEY: BoardIconKey = 'Layers';
export const DEFAULT_DOT_COLOR: DotColorKey = 'plum';
