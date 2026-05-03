# Handoff: Cascade Visual Redesign

## Overview

This is a complete visual redesign of **Cascade**, the privacy-first Kanban task manager (https://github.com/vscarpenter/kanban-todos). The goal is to replace the current cool-grey, flat-purple aesthetic with a warm, editorial direction that feels considered and grown-up — paper surfaces, a refined plum accent, an editorial serif paired with a humanist sans, and a curated icon set replacing the mixed emoji.

The redesign covers the full board view (sidebar + top bar + columns + cards), task modals, filters, and both light and dark themes. Behavior and information architecture are unchanged — this is a visual + system refresh, not a feature change.

## About the Design Files

The files in this bundle are **design references created in HTML/React** — prototypes showing intended look-and-feel, not production code to copy directly.

Cascade is built with **Next.js + React + Tailwind + shadcn/ui** (see the existing repo). The task is to **recreate these designs inside the existing codebase**: port the design tokens to the Tailwind config / CSS variables the app already uses, update existing shadcn components rather than introducing parallel ones, and lift the visual decisions (typography, color, spacing, iconography, shadows) without copying the prototype's React structure verbatim.

`tokens.css` is the source of truth for all design values — start there.

## Fidelity

**High-fidelity.** Colors, typography, spacing, radii, and shadows are final. Reproduce them exactly. Layout proportions are accurate to the current Cascade structure (280px sidebar, 3-column board, fixed-width modals).

## Direction Summary

| Aspect | Before | After |
|---|---|---|
| Surfaces | Cool grey/white (#FFFFFF, #F8F9FA) | Warm paper (#FBF8F3 → #FFFEFB) |
| Accent | Flat purple (#7C3AED-ish) | Refined plum (#6B4A87) |
| Display type | Sans only | **Instrument Serif** for board names, page titles, hero |
| UI type | System sans | **Instrument Sans** (humanist) |
| Numerics | Same as body | **JetBrains Mono** for dates, counts, IDs, tags |
| Board glyphs | Mixed emoji (🚀🏠🎯) | Curated 1.6-stroke line icons + per-board accent dot |
| Card shadows | Hard, cool | Layered, warm (rgb 60/45/25 base) |
| Priority badges | Loud red "high" pill | Muted editorial fills + tiny dot |
| Tags | Outlined chips | Mono-typed compact chips, paper bg |
| Dark mode | Existing | Reworked with plum lifted to #C2A4DB for legibility |

---

## Design Tokens

All tokens live in `tokens.css`. Port these into the existing Tailwind theme / shadcn CSS variables.

### Color — Light

```
/* Paper / surfaces */
--paper-0:    #FBF8F3   /* page bg, warmest */
--paper-1:    #F5F1EA   /* sidebar / muted surface */
--paper-2:    #EDE7DC   /* column bg */
--paper-3:    #E4DCCC   /* dividers */
--paper-card: #FFFEFB   /* card surface */
--hairline:        rgba(28, 26, 23, 0.08)
--hairline-strong: rgba(28, 26, 23, 0.14)

/* Ink */
--ink-1: #1C1A17   /* primary text */
--ink-2: #3A352E   /* body */
--ink-3: #6B6358   /* secondary */
--ink-4: #948C7E   /* tertiary / placeholder */
--ink-5: #BDB4A4   /* disabled */

/* Accent: Plum */
--accent-50:  #F6F0FA
--accent-100: #EADDF3
--accent-200: #D6BCE6
--accent-300: #B690CE
--accent-400: #8E62AB
--accent-500: #6B4A87   /* primary brand */
--accent-600: #553A6C   /* hover/pressed */
--accent-700: #402B52
--accent-ink: #FFFEFB

/* Status (muted, editorial) */
--ok-50:#EDF2EC --ok-200:#BFD3BC --ok-500:#4F7A4B --ok-700:#34522F
--warn-50:#FBF1E1 --warn-200:#EDD3A2 --warn-500:#B07820 --warn-700:#7A5210
--danger-50:#F8E9E5 --danger-200:#E6BBB0 --danger-500:#A8412A --danger-700:#76281A
--info-50:#E8EEF2 --info-200:#B5C6D2 --info-500:#3F627A

/* Per-board accent dots */
--dot-blue:#3F627A --dot-amber:#B07820 --dot-green:#4F7A4B --dot-rose:#A8412A
--dot-plum:#6B4A87 --dot-clay:#9A6240 --dot-moss:#5C6B3C
```

### Color — Dark

```
--paper-0: #14130F   --paper-1: #1B1915   --paper-2: #221F1A
--paper-3: #2D2A23   --paper-card: #1F1D18
--hairline:        rgba(255, 250, 240, 0.07)
--hairline-strong: rgba(255, 250, 240, 0.13)

--ink-1: #F4EFE5   --ink-2: #D9D3C5   --ink-3: #9C9486
--ink-4: #6E675B   --ink-5: #4A453C

--accent-500: #C2A4DB   /* lifted for legibility */
--accent-600: #D4BDE8
--accent-ink: #14130F
```

### Typography

Fonts (Google Fonts):
```
Instrument Sans   (400, 500, 600, 700)
Instrument Serif  (400, 400-italic)
JetBrains Mono    (400, 500, 600)
```

Type scale:

| Token | Family | Size/LH | Weight | Use |
|---|---|---|---|---|
| Display | Serif | 56/60 -0.025em | 400 | Hero copy on landing/about |
| Page title | Serif | 36/40 -0.02em | 400 | Board name in board header |
| Section | Sans | 20/26 -0.005em | 600 | Modal titles |
| Card title | Sans | 14/20 -0.005em | 600 | Task title on card |
| Body | Sans | 13/20 0 | 400 | Card description, paragraph copy |
| Small | Sans | 12/16 0 | 500 | Secondary UI |
| Label | Sans | 11/15 0.14em UPPER | 600 | Eyebrow labels |
| Mono | Mono | 12/16 0 | 500 | Dates, counts, version, IDs |
| Tag | Mono | 11/15 0 | 500 | Tag chips |

Global font features: `font-feature-settings: "ss01", "cv11";` for Instrument Sans. `"tnum"` on mono.

### Spacing — 4px scale
`--s-1` 4 · `--s-2` 8 · `--s-3` 12 · `--s-4` 16 · `--s-5` 20 · `--s-6` 24 · `--s-7` 32 · `--s-8` 40 · `--s-9` 56 · `--s-10` 72

### Radius
`--r-xs` 4 · `--r-sm` 6 · `--r-md` 8 · `--r-lg` 12 · `--r-xl` 16 · `--r-2xl` 20

### Shadows (warm — base rgb is 60/45/25, not pure black)
```
--shadow-xs: 0 1px 0 rgba(60,45,25,0.04)
--shadow-sm: 0 1px 2px rgba(60,45,25,0.06), 0 1px 1px rgba(60,45,25,0.04)
--shadow-md: 0 2px 4px rgba(60,45,25,0.06), 0 4px 12px rgba(60,45,25,0.06)
--shadow-lg: 0 4px 8px rgba(60,45,25,0.07), 0 12px 28px rgba(60,45,25,0.10)
--shadow-xl: 0 8px 16px rgba(60,45,25,0.10), 0 24px 48px rgba(60,45,25,0.14)
--shadow-lift: 0 12px 24px rgba(60,45,25,0.14), 0 32px 60px rgba(60,45,25,0.18)
--focus: 0 0 0 3px rgba(107,74,135,0.28)
```

In dark mode the shadow base is pure black at higher opacity (see `tokens.css`).

---

## Iconography

**Replace all board emojis** (🚀, 🏠, 🎯, 💼, 🌱, 📚, 🎨) with line icons. The set is defined in `icons.jsx` as Lucide-style 24×24 icons at 1.6 stroke. **Lucide React** is the recommended library for the implementation — it's the same visual language. Every icon Cascade uses has a Lucide equivalent.

Mapping current → Lucide:

| Where | Old | New (Lucide) |
|---|---|---|
| Brand mark | Purple square + glyph | Custom logo (see `icons.jsx` → `I.Logo`) — gradient plum, three lines |
| Work Tasks | 🔵 | `Briefcase` + blue dot |
| Product Launch | 🚀 | `Rocket` + rose dot |
| Marketing | 🎯 | `Megaphone` + green dot |
| Client Projects | 💼 | `Briefcase` + clay dot |
| Home Renovation | 🏠 | `Home` + amber dot |
| Side Projects | 🌱 | `Sprout` + plum dot |
| Learning Goals | 📚 | `BookOpen` + moss dot |
| Search | (current) | `Search` |
| Filters | (current) | `SlidersHorizontal` |
| Add task | + | `Plus` |
| Card menu | ⋯ | `MoreHorizontal` |
| Edit task | (current) | `Pencil` |
| Share task | (current) | `Share2` |
| Move to board | (current) | `Move` |
| Archive | (current) | `Archive` |
| Delete | (current) | `Trash2` |
| Overdue | ⚠️ | `AlertTriangle` |
| Due date | 📅 | `Calendar` |
| Tag | 🏷 | `Tag` |
| Theme — light | (current) | `Sun` |
| Theme — dark | (current) | `Moon` |
| Export | ↓ | `Download` |
| Import | ↑ | `Upload` |
| Settings | ⚙ | `Settings` |
| User Guide | ? | `HelpCircle` |
| About | (i) | `Info` |
| Privacy | 🛡 | `Shield` |

**Each board carries a color dot** that's distinct from the icon — boards become identifiable at a glance without losing the curated feel. Dot colors come from the `--dot-*` tokens.

Per-board mapping (default seeds):
```
work    → Briefcase  / --dot-blue
launch  → Rocket     / --dot-rose
mkt     → Megaphone  / --dot-green
client  → Briefcase  / --dot-clay
home    → Home       / --dot-amber
side    → Sprout     / --dot-plum
learn   → BookOpen   / --dot-moss
```

Users creating new boards should pick from a palette of ~12 icons and 7 dot colors (instead of free-form emoji input). This is a small UX change — flag it for the user before shipping.

---

## Screens / Views

### 1. Sidebar (280px, fixed)

**Background:** `var(--paper-1)`. Right border: `1px solid var(--hairline-strong)`.

**Top — Brand block** (padding 20/18/18):
- `<I.Logo size={28} />` — plum gradient square with three white lines
- Wordmark: **Instrument Serif**, 22px, weight 400, letter-spacing -0.02em, color `--ink-1`
- Collapse button (right): 26×26, 6px radius, hairline border, `ChevronLeft` 14px, `--ink-3`

**"Boards" header** (padding 8/20/10):
- Eyebrow: 10.5px, 600, `--ink-4`, letter-spacing 0.14em UPPER
- Add board button: 22×22, 6px radius, hairline border, paper-card bg, `Plus` 12px

**Board list** (gap 4px, horizontal padding 12px):

Each board item (`button`, full width, padding 10/12, 8px radius, text-align left):
- **Inactive:** transparent bg, transparent borders. On hover: bg `var(--paper-2)`.
- **Active:** bg `var(--paper-card)`, hairline-strong border, **3px solid plum left border** (replaces left edge), `--shadow-xs`.
- Layout: `flex; gap: 10; align-items: center`
  - **Icon tile** 26×26, 6px radius, paper-2 bg, hairline border, icon at 14px stroke 1.8 colored by `dot` token
  - **Two-line text** (flex: 1, min-width: 0, ellipsis):
    - Title: 13px, 600, `--ink-1`, ls -0.005em
    - Sub: 11px, `--ink-4`, mt 1
  - **Count badge** (mono): 11px, 500, `--ink-3`, padding 1/6, paper-1 bg, 999px radius, hairline border

**Bottom nav** (border-top hairline, padding 12, gap 2):
- Items: Export, Import, Archive, Settings — each `flex; gap 10; padding 8/10`, 6px radius, transparent bg, 12.5px/500/`--ink-2`. Hover: `--paper-2`.
- Below: version card — paper-card bg, hairline border, 8px radius, padding 10/10:
  - Left: "Cascade `v5.0`" (12px/500/`--ink-2`) + date "May 03 · 2026" (mono 10.5/`--ink-4`)
  - Right: theme toggle pill (Sun / Moon, active state has paper-card bg + xs shadow)

### 2. Top bar (full width, 16/24 padding, hairline-bottom)

- **Search** (flex 1, max-width 540px): paper-card bg, hairline-strong border, 8px radius, xs shadow, padding 8/12.
  - `Search` icon 15px, `--ink-4`
  - Input — 13px, `--ink-1`, sans, no border. Placeholder "Search tasks, tags, boards…", `--ink-4`.
  - `⌘K` chip (mono, 10.5px) on the right
- Spacer (flex 1)
- **Filters** button — secondary style (paper-card, hairline-strong, xs shadow, 8/12 padding, 12.5/600/`--ink-2`). Includes `SlidersHorizontal` 14px and a count chip in plum (`--accent-100` bg, `--accent-700` fg, mono).
- **New Task** button — primary (plum-500 bg, plum-600 border, accent-ink fg, sm shadow, 8/14 padding, 12.5/600).

### 3. Board view header (padding 28/32/20)

- Row: 44×44 icon tile (paper-card, hairline-strong, xs shadow, 10px radius, dot-colored icon at 22px) + serif page title 36/40 weight 400, ls -0.02em, with a **plum period** at the end (`<span style={{color: 'var(--accent-500)'}}>.</span>` after the name) + 13px sub line "{board.sub} · {count} open tasks" with the count in mono.
- **Stats strip** below (mt 22): a single paper-card pill (hairline-strong, xs shadow, 10px radius, padding 4) containing four cells separated by hairline dividers. Each cell: mono number 16px/600 (colored by status — Total `--ink-2`, To Do `--info-500`, In Progress `--warn-500`, Done `--ok-500`) + 11.5px label.

### 4. Board columns (3-up grid, gap 16, padding 0/32/32)

Each column:
- bg `var(--paper-2)`, hairline border, 14px radius, padding 16/14
- **Drop target state:** dashed `--accent-400` border (1.5px) + bg `color-mix(in oklab, var(--accent-50), var(--paper-2) 60%)`
- Header: 8px dot (status color) + label 13/600 + count chip (mono 11/500, paper-1 bg, hairline, 999px) + add button (24×24, transparent, `Plus` 14px, `--ink-4`)
- Body: gap 10px column of task cards

### 5. Task card

`background: var(--paper-card)`, `border: 1px solid var(--hairline)`, `border-radius: 10px`, `padding: 14/14/12`, `box-shadow: var(--shadow-sm)`.

Order:
1. **Title row** — flex, justify-between. Title: 14/600/`--ink-1`, ls -0.005em, line-height 1.35. Right: 22×22 menu button (`MoreHorizontal` 16, `--ink-4`).
2. **Description** — 12.5/400/`--ink-3`, line-height 1.5, mt 6.
3. **Progress** (only if in-progress with progress) — mt 12. Label row (11/`--ink-3`) + mono `40%` value (`--ink-2`/600). Track 4px, paper-2 bg, 999px. Fill: `linear-gradient(90deg, var(--accent-400), var(--accent-500))`.
4. **Badges + tags** — mt 10, flex-wrap gap 6. Priority badge first, then tags.
5. **Due date footer** — mt 10, pt 10, dashed top border (`--hairline`). Icon (Calendar or AlertTriangle) at 13 + mono date. Color: `--ink-3` normally, `--danger-500`/500-weight if overdue. Format: `Apr 21 · Overdue`.

**Lifted card (during drag)** — `transform: rotate(-1.4deg) translateY(-2px)`, `box-shadow: var(--shadow-lift)`, transition 200ms ease both properties. The original slot in the source column gets `opacity: 0.4` (kept in flow as a ghost).

**Drop indicator** — appears in the target column below the lifted card: dashed `--accent-300` border (1.5px), `color-mix(--accent-50 + transparent 30%)` bg, 10px radius, 16px padding, min-height 60px, centered text "Drop to move task here" (12/500/`--accent-600`).

### 6. Priority badge component

```
inline-flex; gap 6; padding 3/8/3/7; radius 999; border 1px hairline;
font 11/500, line-height 1.4
6px round dot (status-500) + label
```

| Level | bg | fg | dot |
|---|---|---|---|
| Low | `--ok-50` | `--ok-700` | `--ok-500` |
| Medium | `--warn-50` | `--warn-700` | `--warn-500` |
| High | `--danger-50` | `--danger-700` | `--danger-500` |

### 7. Tag chip

```
inline-flex; padding 2/7; bg --paper-1; color --ink-3; border 1px hairline;
border-radius 4; font-family mono; font 11/500
```

### 8. Modals (Edit Task / New Task / Filters)

Backdrop: `rgba(28, 26, 23, 0.32)`, blur 4px. Card: `--paper-card` bg, hairline-strong border, 16px radius, `--shadow-xl`, max-width 480 (Edit Task expanded ~520).

Title: serif 22/400 ls -0.015em (e.g., "Edit Task").
Form labels: 12/600/`--ink-2`. Inputs: 8px radius, hairline-strong border, 10/12 padding, 13/400. Focus state: hairline-strong becomes `--accent-500` + `--focus` ring.

Date preset row (Today / Tomorrow / Next Week / No Date): 4-up grid, secondary buttons. Active = primary fill.

Footer: right-aligned button row (gap 8), Cancel (ghost) + Update Task / Create Task (primary).

### 9. Filters popover

Anchored under the Filters button. Width 280, paper-card bg, hairline-strong border, 12px radius, `--shadow-lg`, padding 16. Section headers (label style), togglerows, dropdowns. The "Search all boards" toggle uses plum when on.

---

## Interactions & Behavior

Behavior is identical to the existing app — only the visuals change. Specific motion/transition values:

- **Card hover** — shadow `sm → md` over 150ms ease.
- **Card lift on drag** — `transform: rotate(-1.4deg) translateY(-2px)` + shadow `sm → lift` over 200ms cubic-bezier(0.2, 0.7, 0.3, 1). The slot the card came from holds its place at `opacity: 0.4`.
- **Drop zone** — dashed accent-400 border + tinted bg, fade in 150ms.
- **Sidebar item hover** — bg fade 120ms.
- **Modal enter** — backdrop fade 180ms; dialog fade + `translateY(8 → 0)` 220ms ease-out.
- **Theme switch** — animate `--paper-*`, `--ink-*` over 200ms (CSS transition on `background-color, color, border-color`).
- **Focus ring** on all interactive elements — `box-shadow: var(--focus)`.

Drag library: keep the existing dnd-kit setup; only restyle the lift/drop visuals.

---

## Voice / Copy

Trim cute language. Buttons are verbs. Examples:

| Don't | Do |
|---|---|
| 🚀 Let's get those tasks done! | No tasks yet. Drag one here to start. |
| Successfully created your task ✨ | Task added to To Do. |

Keep `(Overdue)` parenthetical → switch to ` · Overdue` (mono separator).

---

## State Management

No changes. The redesign reuses the existing Zustand stores (`boards`, `tasks`, `settings`, `theme`). The only new persisted state is:
- Per-board `iconKey` (string, default chosen by user from picker) — replaces the freeform emoji field.
- Per-board `dotColor` (one of the `--dot-*` tokens) — new.

A migration is needed: for existing boards with emoji, map the emoji to an icon key + dot color where possible (use the table above), otherwise default to `Layers` + `--dot-plum`.

---

## Files in this bundle

| File | Purpose |
|---|---|
| `Cascade Redesign.html` | Open this in a browser to see the full design canvas — design system spec on top, three board mocks below (light, drag-preview, dark). |
| `tokens.css` | **Source of truth** for all design tokens, light + dark. Port to your Tailwind config / CSS variables. |
| `icons.jsx` | Lucide-style icon set — useful as a visual reference; in production use `lucide-react` directly. The `I.Logo` component IS the new brand mark and should be ported. |
| `board.jsx` | Reference React for the full board view (sidebar, top bar, header, columns, cards, badges, tags). |
| `spec.jsx` | Reference React for the spec page (type, color, components, voice). |
| `design-canvas.jsx` | Pan/zoom canvas wrapper — not part of the app, just hosts the mocks. |

---

## Implementation order (suggested)

1. **Fonts + tokens** — load Instrument Sans / Instrument Serif / JetBrains Mono; port `tokens.css` to the Tailwind theme. Verify both light and dark by toggling at the root.
2. **Brand mark + icon swap** — replace the existing logo with `I.Logo`; install `lucide-react`; build the per-board icon+dot picker; write the emoji→icon migration.
3. **Sidebar** — restyle the boards list to use the new active-state and icon tiles.
4. **Top bar + board header** — serif page title with plum period, stats pill, primary/secondary buttons.
5. **Columns + cards** — paper surfaces, refined badge/tag treatment, dashed-top due-date footer, mono dates.
6. **Drag visuals** — lift + drop indicator using the values above.
7. **Modals** — apply new chrome to Edit Task, New Task, Filters popover.
8. **Dark mode** — verify token swap; tune any one-off colors.
9. **Landing page** (`/about`) — apply serif display, paper bg, refined feature grid (out of scope for the app shell but worth doing for brand consistency).

---

## Open questions for the user

- Are users OK with losing freeform emoji on boards in exchange for the curated icon+dot picker?
- Should the brand wordmark stay as text ("Cascade" in serif) or move to the new gradient logomark with a tighter wordmark?
- Should overdue dates stay red, or shift to amber as a softer signal?
