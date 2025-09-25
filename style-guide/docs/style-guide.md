# Cascade UI Style Guide

The Cascade design system packages the colors, type, spacing, motion, and interaction patterns already in the application into reusable tokens. Every token lives in [`/style-guide/tokens`](../tokens) and is surfaced either as JSON, CSS custom properties, or a Tailwind theme extract.

## Color System

### Neutral Gray Ramp
| Step | Hex | HSL | Typical Usage |
| --- | --- | --- | --- |
| 25 | `#fcfcfd` | `hsl(240 20% 99%)` | App canvas, large backgrounds |
| 50 | `#f8f9fb` | `hsl(220 27% 98%)` | Raised cards, sheets |
| 100 | `#f1f3f9` | `hsl(225 40% 96%)` | Input backgrounds, subtle fills |
| 200 | `#e2e6f0` | `hsl(223 32% 91%)` | Default borders, separators |
| 300 | `#d5d9e3` | `hsl(223 20% 86%)` | Hover borders, quiet tags |
| 400 | `#aeb4c0` | `hsl(220 12% 72%)` | Disabled text/icons |
| 500 | `#7a808f` | `hsl(223 9% 52%)` | Neutral icons, tertiary text |
| 600 | `#5b616f` | `hsl(222 10% 40%)` | Secondary text, placeholder copy |
| 700 | `#444955` | `hsl(222 11% 30%)` | Section headings on light surfaces |
| 800 | `#2f333d` | `hsl(223 13% 21%)` | Inverted surfaces, dark overlays |
| 900 | `#1f2229` | `hsl(222 14% 14%)` | Body text on light mode |
| 950 | `#0a0c10` | `hsl(220 25% 6%)` | Foreground on brand fills in dark mode |

### Primary Violet Ramp
| Step | Hex | HSL | Typical Usage |
| --- | --- | --- | --- |
| 25 | `#f9f6ff` | `hsl(260 100% 98%)` | Hero washes, onboarding backgrounds |
| 50 | `#f3edff` | `hsl(260 100% 96%)` | Subtle callouts, selection highlight |
| 100 | `#e6ddff` | `hsl(256 100% 93%)` | Focus selection, quiet badges |
| 200 | `#d2c0ff` | `hsl(257 100% 88%)` | Accent surfaces, charts |
| 300 | `#b59aff` | `hsl(256 100% 80%)` | Outline glows, hover states |
| 400 | `#9b74ff` | `hsl(257 100% 73%)` | Primary hover fill, data hover |
| 500 | `#8b5cf6` | `hsl(258 90% 66%)` | Brand buttons, sliders, main accents |
| 600 | `#7a3bed` | `hsl(261 83% 58%)` | Link color, active states |
| 700 | `#6827d4` | `hsl(263 69% 49%)` | High contrast text on tinted backgrounds |
| 800 | `#5421ad` | `hsl(262 68% 40%)` | Dark emphasis surfaces |
| 900 | `#421b87` | `hsl(262 67% 32%)` | Charts, accent borders |
| 950 | `#2b125b` | `hsl(261 67% 21%)` | Dark overlays, elevated nav |

### Secondary Indigo Ramp
| Step | Hex | HSL | Typical Usage |
| --- | --- | --- | --- |
| 25 | `#f5f9ff` | `hsl(216 100% 98%)` | Secondary canvas, empty states |
| 50 | `#edf3ff` | `hsl(220 100% 96%)` | Secondary panels |
| 100 | `#dbe8ff` | `hsl(218 100% 93%)` | Info callouts |
| 200 | `#bcd3ff` | `hsl(219 100% 87%)` | Badge backgrounds |
| 300 | `#94b7ff` | `hsl(220 100% 79%)` | Hover fill for secondary buttons |
| 400 | `#6d98ff` | `hsl(220 100% 71%)` | Secondary hover outline |
| 500 | `#4f7ff9` | `hsl(220 94% 64%)` | Secondary actions and tabs |
| 600 | `#3a65dd` | `hsl(225 72% 55%)` | Secondary active states |
| 700 | `#2f50b5` | `hsl(225 58% 45%)` | Text on secondary tints |
| 800 | `#253e8c` | `hsl(226 57% 34%)` | Indigo surfaces |
| 900 | `#1c2f69` | `hsl(227 58% 26%)` | Charts, depth |
| 950 | `#132047` | `hsl(227 59% 18%)` | Overlays, dark nav |

### Status Ramps
- **Success (emerald):** `#f4fbf7` → `#051d0f` for positive feedback, toasts, progress bars.
- **Warning (amber):** `#fff9f0` → `#2c1501` for cautionary banners and due date warnings.
- **Danger (rose):** `#fff5f7` → `#2d010b` for destructive buttons, error toasts, validation states.

### Data Visualization Palette
| Key | Hex | HSL | Contrast on Light | Contrast on Dark | Recommended Text |
| --- | --- | --- | --- | --- | --- |
| Violet | `#8b5cf6` | `hsl(258 90% 66%)` | 4.23 | 4.22 | `#0f172a` / `#f8fafc` |
| Indigo | `#6366f1` | `hsl(239 84% 67%)` | 4.47 | 4.00 | `#0f172a` / `#f8fafc` |
| Blue | `#3b82f6` | `hsl(217 91% 60%)` | 3.68 | 4.85 | `#0f172a` / `#f8fafc` |
| Sky | `#0ea5e9` | `hsl(199 89% 48%)` | 2.77 | 6.44 | `#0f172a` / `#f8fafc` |
| Cyan | `#06b6d4` | `hsl(189 94% 43%)` | 2.43 | 7.35 | `#0f172a` / `#f8fafc` |
| Teal | `#14b8a6` | `hsl(173 80% 40%)` | 2.49 | 7.17 | `#0f172a` / `#f8fafc` |
| Emerald | `#22c55e` | `hsl(142 71% 45%)` | 2.28 | 7.83 | `#0f172a` / `#f8fafc` |
| Lime | `#84cc16` | `hsl(84 81% 44%)` | 1.98 | 9.04 | `#0f172a` / `#f8fafc` |
| Amber | `#f59e0b` | `hsl(38 92% 50%)` | 2.15 | 8.31 | `#0f172a` / `#f8fafc` |
| Orange | `#f97316` | `hsl(25 95% 53%)` | 2.80 | 6.37 | `#0f172a` / `#f8fafc` |
| Rose | `#f43f5e` | `hsl(350 89% 60%)` | 3.67 | 4.86 | `#0f172a` / `#f8fafc` |
| Pink | `#ec4899` | `hsl(330 81% 60%)` | 3.53 | 5.06 | `#0f172a` / `#f8fafc` |

Use pairings listed in the final column to keep chart labels above AA contrast on light and dark dashboards.

## Typography
- Primary sans: `var(--font-sans)` (Geist, Inter fallback) with optical sizing features already enabled in `globals.css`.
- Mono: `var(--font-mono)` for code, metrics, and identifiers.
- Modular scale ratio `1.25` aligned with existing heading treatments.

| Token | Size | Line Height | Letter Spacing | Recommended Context |
| --- | --- | --- | --- | --- |
| `display-2` | 3.815rem | 1.05 | -0.03em | Hero headlines, marketing moments |
| `display-1` | 3.052rem | 1.05 | -0.025em | Page headlines |
| `h1` | 2.441rem | 1.1 | -0.02em | Section headers, modals |
| `h2` | 1.953rem | 1.15 | -0.015em | Board titles |
| `h3` | 1.563rem | 1.2 | -0.01em | Column headers |
| `h4` | 1.25rem | 1.25 | -0.006em | Dialog titles |
| `h5` | 1.125rem | 1.35 | -0.004em | Task subtitles |
| `h6` | 1rem | 1.4 | 0em | Navigation labels |
| `body` | 1rem | 1.6 | 0em | Default paragraph text |
| `sm` | 0.875rem | 1.6 | 0em | Metadata, secondary labels |
| `xs` | 0.75rem | 1.6 | 0.01em | Legal copy, helper text |
| `code` | 0.875rem | 1.5 | 0em | Inline code, CLI snippets |

**Usage tips**
- Combine `font-semibold` with `h1–h4` tokens to match existing heading weight.
- Inline emphasis stays within the modular scale: use `sm` for quiet meta text rather than scaling opacity.
- For code blocks, apply `font-mono` and `bg-[var(--bg-subtle)]` with `rounded-[var(--radius-lg)]` for consistency.

## Spacing & Layout

The spacing scale is linear in 4px increments with named t-shirt sizes and numeric aliases that match Tailwind utilities from the extract config.

| Token | Alias | Value | Example |
| --- | --- | --- | --- |
| `--space-none` | `0` | 0rem | Reset margins |
| `--space-3xs` | `1` | 0.25rem | Icon padding |
| `--space-2xs` | `2` | 0.5rem | Chip horizontal padding |
| `--space-xs` | `3` | 0.75rem | Inline gaps in badges |
| `--space-sm` | `4` | 1rem | Card padding in Kanban columns |
| `--space-md` | `5` | 1.25rem | Dialog body spacing |
| `--space-lg` | `6` | 1.5rem | Section padding |
| `--space-xl` | `7` | 1.75rem | Sidebar gutters |
| `--space-2xl` | `8` | 2rem | Page gutters on desktop |
| `--space-3xl` | `9` | 2.25rem | Large modals |
| `--space-4xl` | `10` | 2.5rem | Board canvas padding |

**Layout examples**
```tsx
<div
  className="bg-[var(--bg-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow-md)]
             px-[var(--space-lg)] py-[var(--space-md)] space-y-[var(--space-sm)]"
>
  <h2 className="text-[var(--fg-default)] text-[var(--font-size-h2,1.953rem)] font-semibold">Board settings</h2>
  <p className="text-[var(--fg-muted)]">Organize columns, limits, and automations in one place.</p>
</div>
```
- Control heights align to `--size-control-sm|md|lg` (32px / 36px / 40px). Use them for buttons, inputs, and selects to keep tap targets consistent.
- Apply `min-h-[var(--size-control-lg)]` on drag handles or reorder affordances to ensure 44px touch guidance.

## Shadows, Radii, Motion
- Radii cascade from `--radius-xs` (4px) for chips to `--radius-xl` (14px) for modals. `--radius-pill` is reserved for pill badges and toggle switches.
- Shadows follow depth tiers already in production (`shadow-xs` for inputs, `shadow-lg` for overlays). Reference the variables in CSS or Tailwind via `shadow-[var(--shadow-md)]` when custom values are needed.
- Motion durations follow interaction intent: `--motion-duration-fast` (150ms) for hover transitions, `--motion-duration-base` (200ms) for standard dialog motion, `--motion-duration-linger` (500ms) for toast dismissal. Ease curves mirror current Radix primitives.

## Component State Guidelines
- **Hover:** lighten surfaces one tone (`background-color: var(--bg-subtle)`) and elevate via `shadow-xs`. Buttons swap to their `--emphasis-*-hover` fills.
- **Focus:** apply a 3px outline using `var(--focus-ring)` plus `box-shadow: 0 0 0 3px var(--focus-outline)` to meet the Accessible Focus Indicator rule. Works for both modes.
- **Active/Pressed:** darken to the next chroma step (`primary` 600 → 700) and reduce elevation (`shadow-none`).
- **Selected:** use `--selection-bg` and `--selection-fg`, or for chips apply `var(--subtle-bg)`/`var(--subtle-fg)`.
- **Disabled:** neutralize color via `--disabled-fg`, remove shadow, and set `background-color: var(--disabled-bg)` with `cursor-not-allowed`.
- **Destructive:** reserve `--emphasis-danger` for primary destructive actions and pair with `--focus-ring` to guarantee focus visibility. Hover to `--color-danger-400` only when confirming the intent (e.g., double-confirm dialogs).

## Accessibility Checklist
| Context | Colors | Contrast Ratio |
| --- | --- | --- |
| Body text (light) | `#1f2229` on `#fcfcfd` | 15.53 |
| Secondary text (light) | `#5b616f` on `#f8f9fb` | 5.89 |
| Primary button (light) | `#fcfcfd` on `#8b5cf6` | 4.13 |
| Secondary button (light) | `#1f2229` on `#4f7ff9` | 4.35 |
| Critical button | `#fcfcfd` on `#e11d48` | 4.58 |
| Body text (dark) | `#fcfcfd` on `#0a0c10` | 17.64 |
| Secondary text (dark) | `#d5d9e3` on `#2f333d` | 8.94 |
| Primary button (dark) | `#0a0c10` on `#8b5cf6` | 4.62 |

Additional guidance:
- Maintain minimum target sizes of `44px` on coarse pointers (already encoded in `IOSClassProvider` utilities). Use `min-h-[var(--size-control-lg)]` for tappable elements when viewport > 1024px with a coarse pointer.
- Respect reduced motion preferences with the `.reduce-motion` utility already in `globals.css`; avoid overriding with custom keyframes without providing safe fallbacks.
- Leverage `::selection` variables for consistent text highlight and ensure high-contrast focus outlines even when components override border colors.

## Migration Tips
1. **Adopt CSS variables inline:** replace ad-hoc values with tokens, e.g. `className="bg-[var(--bg-surface)] text-[var(--fg-default)]"` instead of `bg-white text-zinc-900`.
2. **Use the Tailwind extract:** import `style-guide/tailwind.theme.extract.cjs` inside `tailwind.config.ts` and spread the `theme` object into `theme.extend` to get token-aware utilities (`text-emphasis-primary`, `bg-canvas`, spacing aliases, etc.).
3. **Unify focus states:** swap bespoke focus utilities with `focus-visible:outline-[var(--focus-outline)] focus-visible:ring-[var(--focus-ring)]` so keyboard navigation stays consistent.
4. **Refactor inline styles:** map colors in components like `CreateBoardDialog` to `dataViz` tokens so board color pickers stay in sync across apps.
5. **Document module usage:** when introducing new UI primitives (e.g., toast variants), add semantic mappings first (`tokens/semantic.json`), then consume via `var(--emphasis-success)` etc. This ensures light/dark parity for free.
6. **Test coverage:** run `npm run lint` and `npm test` after replacing colors to catch snapshots expecting legacy hex values. Update assertions to reference tokenized classes.

By centralizing on these tokens, additional clients (desktop, mobile web, future native shells) can import the same JSON to keep Cascade consistent.
