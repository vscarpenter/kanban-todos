---
name: Cascade
description: Ink on cool stone — a quiet, precisely-ruled kanban system built from platform fonts and 1.5px frames.
colors:
  ink-indigo: "#3B4A8C"
  ink-indigo-deep: "#2A3768"
  ink-indigo-tint: "rgba(59, 74, 140, 0.14)"
  cool-stone: "#F4F4F0"
  paper: "#FFFFFF"
  graphite: "#13141B"
  oat: "#DDDCDF"
  putty-100: "#EDEDEA"
  putty-200: "#E1E1DE"
  putty-300: "#CFCFCC"
  putty-500: "#6F6F75"
  putty-700: "#3A3B41"
  olive: "#788C5D"
  rust: "#B04A3F"
  ochre: "#C78E3F"
  blueprint: "#5C7CA3"
  dot-blue: "#3F627A"
  dot-amber: "#B07820"
  dot-green: "#4F7A4B"
  dot-rose: "#A8412A"
  dot-plum: "#6B4A87"
  dot-clay: "#9A6240"
  dot-moss: "#5C6B3C"
typography:
  display:
    fontFamily: "ui-serif, Georgia, 'Times New Roman', Times, serif"
    fontSize: "3rem"
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "ui-serif, Georgia, 'Times New Roman', Times, serif"
    fontSize: "2.25rem"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  title:
    fontFamily: "ui-serif, Georgia, 'Times New Roman', Times, serif"
    fontSize: "1.875rem"
    fontWeight: 500
    lineHeight: 1.22
    letterSpacing: "-0.008em"
  subtitle:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.005em"
  body:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "normal"
  card-title:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "-0.005em"
  label:
    fontFamily: "ui-monospace, 'SF Mono', Menlo, Monaco, Consolas, monospace"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: "15px"
    letterSpacing: "0.14em"
  mono:
    fontFamily: "ui-monospace, 'SF Mono', Menlo, Monaco, Consolas, monospace"
    fontSize: "11px"
    fontWeight: 500
    lineHeight: 1.4
    fontFeature: "'tnum' 1, 'zero' 1"
rounded:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "14px"
  xl: "20px"
  pill: "999px"
spacing:
  sp-1: "4px"
  sp-2: "8px"
  sp-3: "12px"
  sp-4: "16px"
  sp-5: "24px"
  sp-6: "32px"
  sp-7: "48px"
  sp-8: "64px"
components:
  button-primary:
    backgroundColor: "{colors.ink-indigo}"
    textColor: "{colors.paper}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
    height: "36px"
  button-primary-hover:
    backgroundColor: "rgba(59, 74, 140, 0.9)"
    textColor: "{colors.paper}"
  button-outline:
    backgroundColor: "{colors.putty-100}"
    textColor: "{colors.graphite}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
    height: "36px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.graphite}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
    height: "36px"
  button-destructive:
    backgroundColor: "{colors.rust}"
    textColor: "#FFFFFF"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
    height: "36px"
  input-field:
    backgroundColor: "{colors.putty-100}"
    textColor: "{colors.graphite}"
    rounded: "{rounded.sm}"
    padding: "4px 12px"
    height: "36px"
  card-task:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.graphite}"
    typography: "{typography.card-title}"
    rounded: "{rounded.md}"
    padding: "14px 14px 12px"
  column-kanban:
    backgroundColor: "{colors.putty-100}"
    textColor: "{colors.graphite}"
    rounded: "{rounded.lg}"
    padding: "16px 14px"
  column-count-pill:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.putty-500}"
    typography: "{typography.mono}"
    rounded: "{rounded.pill}"
    padding: "1px 6px"
  badge-default:
    backgroundColor: "{colors.ink-indigo}"
    textColor: "{colors.paper}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
---

# Design System: Cascade

## Overview

**Creative North Star: "The Field Notebook"**

Cascade looks like a good notebook feels. Indigo ink on cool stone stock, ruled hairlines that
actually mean something, mono labels stamped small and wide. A notebook is yours, works without
power, and nobody else reads it — which is the same thing the product is, expressed in surfaces
instead of architecture. Nothing here is trying to be impressive on first sight; it is trying to
still be pleasant on the four-hundredth open.

The register is quiet, precise, and warm at once. Quiet: color is rationed, decoration is
effectively zero, and the interface recedes behind the task. Precise: hairline rules, tabular
numerals, and an unbroken 8px rhythm mean nothing sits at an accidental measurement. Warm: surfaces
read as paper rather than glass, shadows are low-spread and soft rather than crisp, and a card
lifts two pixels under the cursor because objects you handle should acknowledge being handled.

Serif headings are part of the warmth, not a claim to being editorial. They soften a dense
utilitarian tool the way a hand-written title softens a ruled page — this is a notebook, not a
magazine, and the type should never start performing. The whole system is built from platform fonts
only: no webfont ever loads, which is both a performance position and a privacy one, since a font
request is a request to somebody else's server.

**Key Characteristics:**

- Signature 1.5px borders — the defining gesture, present on every meaningful surface
- Cool stone page, white paper cards, deep indigo ink; a three-value world before any accent
- Platform fonts only (system sans, `ui-serif`, `ui-monospace`) — zero webfont requests
- Serif for h1–h3, sans for h4–h6 and body, mono for every label and every number
- 11px uppercase mono eyebrows at 0.14em tracking as the universal label voice
- Borders define depth at rest; shadows are reserved for state changes
- Light and dark are equal citizens, crossfading over 200ms rather than snapping

## Colors

A three-material palette — stone, paper, ink — with a small set of pigments reserved for meaning.
The system is nearly monochrome until information demands otherwise.

### Primary

- **Ink Indigo** (`#3B4A8C`): The single brand voice. Primary buttons, the 3px active-board rule in
  the sidebar, focus rings, and the drag-target outline. In dark mode it lifts to a periwinkle
  (`#7A8AD1`) rather than darkening, because a saturated indigo goes muddy against near-black.
- **Ink Indigo Deep** (`#2A3768`): The pressed and bordered companion. Carries the 1.5px border on
  primary buttons so the accent has an edge rather than a glow.

### Secondary

The system has no second brand color, and should not acquire one. What follows are semantic
pigments, not a secondary palette.

### Tertiary

- **Olive** (`#788C5D`): Success and the `done` status dot. Muted and vegetal, never a signal green.
- **Rust** (`#B04A3F`): Destructive actions, errors, and overdue state. Earthy, not emergency-red.
- **Ochre** (`#C78E3F`): Warnings and the `in-progress` status dot.
- **Blueprint** (`#5C7CA3`): Informational state and the `todo` status dot. Deliberately close to
  the accent in hue but far lower in chroma, so it never competes for "this is the action."

### Neutral

- **Cool Stone** (`#F4F4F0`): The page. A stone that leans cool and slightly green — not a warm
  cream, not a pure white.
- **Paper** (`#FFFFFF`): Card and panel surfaces. The thing that sits *on* the stone.
- **Graphite** (`#13141B`): Primary text, with a cool undertone that keeps it from reading as pure
  black. Also the hover border color, where it acts as the darkest available rule.
- **Oat** (`#DDDCDF`): Tertiary surfaces and hover thumbnails.
- **Putty 100–700** (`#EDEDEA`, `#E1E1DE`, `#CFCFCC`, `#6F6F75`, `#3A3B41`): The cool putty scale.
  100 is the column and sidebar surface, 300 is the default rule color, 500 is muted text and every
  mono label, 700 is secondary text.

### Board Dots (locked)

- **Blue** (`#3F627A`), **Amber** (`#B07820`), **Green** (`#4F7A4B`), **Rose** (`#A8412A`),
  **Plum** (`#6B4A87`), **Clay** (`#9A6240`), **Moss** (`#5C6B3C`): the categorical palette a person
  picks from when labeling a board. All seven are desaturated to sit inside the notebook world
  rather than on top of it.

### Named Rules

**The Rationed Ink Rule.** Ink Indigo carries one primary action per view, the active-board rule,
and focus. Its scarcity is what makes it legible as "the important thing," so it is never used
decoratively, never for a surface fill, and never for a second competing button. The semantic
pigments are exempt: olive, rust, ochre, and blueprint are *information*, and may appear as often as
the data requires. Rationing applies to brand voice, not to meaning.

**The Locked Dot Rule.** The seven board dot hexes are user data, not theme. Someone chose "Rose"
for a board and that choice is persisted in their IndexedDB record. Never remap, restyle, or
re-theme them across a design change; a redesign that shifts these values silently relabels every
board the person already made.

**The Cool Undertone Rule.** Every neutral in this system leans cool. No warm greys, no cream, no
sepia. A warm neutral introduced anywhere will read as a mistake next to the stone.

## Typography

**Display Font:** `ui-serif` (with Georgia, Times New Roman fallback)
**Body Font:** `system-ui` (with -apple-system, Segoe UI, Roboto fallback)
**Label/Mono Font:** `ui-monospace` (with SF Mono, Menlo, Monaco fallback)

**Character:** A serif that arrives already installed, paired with the reader's own system sans and
a mono reserved entirely for labels and numbers. The pairing is warm at the top of the page and
utilitarian everywhere else — a titled notebook rather than a set magazine. Because all three are
platform stacks, the exact faces differ per OS by design; the system is built on *roles*, not on
one company's typeface.

### Hierarchy

- **Display** (serif, 500, 3rem → 3.75rem at `lg`, 1.1, -0.02em): Page titles. One per view.
- **Headline** (serif, 500, 2.25rem → 3rem at `lg`, 1.2, -0.01em): Major section headings.
- **Title** (serif, 500, 1.875rem → 2.25rem at `lg`, 1.22, -0.008em): Subsection headings. The
  serif range ends here.
- **Subtitle** (sans, 600, 1.5rem → 1.875rem at `lg`, 1.25, tight tracking): h4 and below switch to
  sans — the point where type stops being a title and starts being an interface.
- **Body** (sans, 400, 16px, 1.55): Default text. Paragraphs use `text-wrap: pretty`; all headings
  use `text-wrap: balance`.
- **Card Title** (sans, 600, 14px, 1.35, -0.005em): Task card titles. Deliberately smaller than
  body — a card is a glanceable unit, not a paragraph.
- **Label** (mono, 600, 11px, 0.14em, uppercase, Putty 500): The eyebrow. The single label voice
  across the entire system.
- **Mono/Numeric** (mono, 500, 11px, `tnum` + `zero`): Counts, metadata, and anything a person might
  compare vertically.

### Named Rules

**The Platform Font Rule.** No webfont, ever. Not Google Fonts, not a self-hosted `@font-face`, not
an icon font. Every face resolves from the visitor's own machine. This is a hard invariant with two
justifications — a font request is a request to a third-party server, and a system with no font
payload cannot have a flash of unstyled text.

**The Mono Label Rule.** Every label, eyebrow, count, and metadata string is 11px uppercase mono at
0.14em tracking. There is no second label style. If a new label appears and it isn't this, it's
wrong.

**The Tabular Numeral Rule.** Any number a person might scan a column of — counts, progress,
dates — gets `font-variant-numeric: tabular-nums slashed-zero`. Numbers that shift horizontally as
they change are a defect, not a detail.

**The Serif Ceiling Rule.** Serif stops at h3. Below that, sans. A serif h5 makes the system look
like a blog, which it isn't.

## Layout

Space is built on an 8px base with a 4px micro-step (`--sp-1` 4px through `--sp-8` 64px). Component
padding lands on that grid almost everywhere; the deliberate exceptions are the task card
(`14px 14px 12px`) and the kanban column (`16px 14px`), where the optical result beat the arithmetic
one — the bottom is tightened because metadata text sits higher than its box.

The board is a horizontal set of columns, each a bounded surface with its own header, count pill,
and scroll region. On narrow viewports the columns become a scroll-snapping horizontal track
(`scroll-snap-type: x mandatory`, `snap-stop: always`), so a swipe lands cleanly on one column
rather than between two. The sidebar is a persistent navigation surface on desktop and a dismissible
overlay on mobile.

Density is comfortable rather than compressed. This is a tool for reading your own work at a glance,
so cards breathe and columns keep their margins even when the board is full.

Touch targets are 44px minimum on mobile via `.touch-target-mobile`, relaxing to natural size at
`768px`; iPad at coarse pointer and ≥1024px goes to 48px. Buttons carry `min-h-[45px]` below the
`sm` breakpoint and drop to their 36px desktop height above it — the mobile size is the honest one,
and the desktop size is the compression.

The single named breakpoint set is Tailwind's default (`sm` 640, `md` 768, `lg` 1024, `xl` 1280).

## Elevation & Depth

**Borders define; shadows respond.** At rest, this system is nearly flat: what separates a card from
its column is a 1.5px rule and a one-pixel shadow, not elevation. Depth is a *reaction* — it appears
when you hover, drag, focus, or open something, and it recedes the moment you stop. A card sitting
still with a heavy shadow is off-system.

There is also a genuine tonal stack underneath, and it should be preserved in that order: Cool Stone
page → Putty 100 column → Paper card. Each step is a lighter, more foregrounded material, which is
why cards read as objects on a surface even before any shadow is drawn.

### Shadow Vocabulary

- **Hairline** (`0 1px 0 rgba(20,20,19,0.04)`): The barely-there seat. Active sidebar items.
- **Resting** (`0 1px 2px rgba(20,20,19,0.06)`): The default card shadow. Almost subliminal.
- **Raised** (`0 4px 14px rgba(20,20,19,0.08)`): Focus-within and small popovers.
- **Card Hover** (`0 10px 30px rgba(20,20,19,0.10)`): Paired with a -2px translate on task cards.
- **Overlay** (`0 12px 28px rgba(20,20,19,0.12)`): Dropdowns and popovers.
- **Modal** (`0 24px 48px rgba(20,20,19,0.18)`): Dialogs.
- **Lift** (`0 32px 60px rgba(20,20,19,0.22)`): The dragged card only. The highest elevation in the
  system, reserved for the one object literally in the person's hand.
- **Focus ring** (`0 0 0 3px rgba(59,74,140,0.18)`): Not elevation, but composes with the above.

In dark mode every shadow alpha roughly quadruples (0.04 → 0.30, 0.18 → 0.60), because a soft shadow
on a near-black surface is invisible otherwise.

### Named Rules

**The Frame-First Rule.** Reach for a border before a shadow. If a new surface needs separation, it
gets a 1.5px Putty 300 rule; a shadow is added only if the surface must also read as *above* the
thing behind it.

**The Lift-Is-Earned Rule.** Elevation maps to interaction, not importance. The heaviest shadow in
the system belongs to the card being dragged, not to the most important card.

## Shapes

Corners are gently rounded and the radius grows with the surface: 4px on the smallest chips, 8px on
buttons and inputs, 12px on task cards, 14px on kanban columns and drag ghosts, 20px on the largest
panels, and a full pill (999px) on count badges. Nothing in the system is a hard 0px corner, and
nothing organic or blobby appears anywhere.

The defining form is not the corner, though — it's the **1.5px border**. Half a pixel heavier than
the browser default hairline, which is exactly enough to read as a deliberate drawn rule rather than
an incidental edge. It appears on task cards, kanban columns, active sidebar items, buttons, and
inputs. Thinner 1px rules are used for internal dividers (stats-pill cells, count badges) where the
line is separating rather than bounding.

The drag ghost is the one dashed form in the system: a 1.5px dashed indigo outline at 14px radius
over a 30%-strength indigo tint, marking a space that is reserved but not yet filled.

Note a real second radius scale exists: shadcn primitives derive from `--radius: 0.625rem` (sm 6px,
md 8px, lg 10px, xl 14px), which is why a shadcn `rounded-md` button lands at 8px and matches the
Inkwell `--r-sm`. The two scales agree at the sizes that matter; prefer the `--r-*` scale when
authoring new surfaces.

## Components

### Buttons

- **Shape:** Softly rounded (8px), 36px tall on desktop, 45px minimum on mobile
- **Primary:** Ink Indigo fill, Paper text; hover drops to 90% opacity of the same indigo
- **Outline:** Putty 100 surface with a Putty 300 rule; hover deepens the surface to Putty 200
- **Secondary:** Putty 200 surface, Graphite text; hover to 80% opacity
- **Ghost:** No surface at rest; hover reveals a Putty 200 fill
- **Destructive:** Rust fill, white text, with a rust-tinted focus ring
- **Link:** Ink Indigo text with a 4px underline offset, underlined on hover
- **Hover / Focus:** All buttons transition background, color, and shadow over 150ms. Focus is a
  2px Ink Indigo ring at 2px offset — never a removed outline
- **Icon:** Square, 45px on mobile and 36px on desktop; inner SVG locked to 16px

### Cards / Containers

- **Corner Style:** 12px on task cards, 14px on columns
- **Background:** Paper cards on a Putty 100 column on a Cool Stone page
- **Border:** 1.5px Putty 300, going to Graphite on hover — the border darkens rather than the
  surface changing
- **Shadow Strategy:** Resting at rest, Card Hover on hover paired with a -2px lift; `:active`
  returns to flat immediately; `:focus-within` composes Raised with the focus ring
- **Internal Padding:** `14px 14px 12px` on task cards, `16px 14px` on columns
- **Motion:** Cards enter with `card-enter` — 300ms fade with an 8px rise and a 0.98 → 1 scale
- **Touch:** All hover transforms are disabled under `@media (hover: none)`, so a tapped card on a
  phone doesn't stick in a hover state

### Inputs / Fields

- **Style:** Putty 100 surface, 1.5px Putty 300 rule, 8px radius, 36px tall
- **Focus:** 2px Ink Indigo ring at 2px offset, with the border going transparent so the ring reads
  as a single clean stroke rather than a doubled edge
- **Error:** `aria-invalid` drives a Rust border and a rust-tinted ring — the error state is bound
  to the accessibility attribute, not to a separate visual prop
- **Mobile:** Base font-size stays 16px to prevent iOS zoom-on-focus; it drops to 14px at `md`

### Navigation (Sidebar)

- **Surface:** Putty 100. In dark mode only, it gains a 20px backdrop blur at 1.3 saturation
- **Active state:** Paper surface, 1.5px rule, Hairline shadow, and a 3px Ink Indigo bar down the
  left edge, radiused 2px on its outer corners — the signature selection gesture
- **Board rows:** Each carries its user-chosen dot color as a small filled circle
- **Mobile:** Becomes a dismissible overlay

### Kanban Column *(signature)*

A bounded Putty 100 surface with a 1.5px rule and 14px corners, holding a header row, a count pill,
and a scrolling card region. The **count pill** is the system in miniature: 11px mono with tabular
numerals, Paper fill, 1px Putty 300 rule, full pill radius, `1px 6px` padding. The status dot beside
each header maps to the semantic pigments — Blueprint for todo, Ochre for in-progress, Olive for
done. When a column is a valid drop target it runs `drop-zone-pulse`, a 1.5s breathing loop between
the indigo tint at 60% and 90% strength.

### Task Card *(signature)*

Paper on a 1.5px rule at 12px radius, with a 14px semibold sans title, mono metadata beneath, and an
optional progress bar. Hover lifts it 2px and darkens the border to Graphite. While dragging on iOS
it rotates -1.4° and lifts, carrying the heaviest shadow in the system — the card is in your hand,
so it behaves like paper being moved.

### Stats Pill

A single inline row of cells divided by 1px Putty 200 rules, which reflows to a 2×2 grid below
640px with the dividers re-drawn on the correct interior edges. A small piece of real craft worth
preserving: the responsive collapse rebuilds the rules rather than dropping them.

## Do's and Don'ts

### Do:

- **Do** use the 1.5px border as the first tool for separating any new surface (Putty 300 at rest,
  Graphite on hover).
- **Do** keep Ink Indigo to one primary action per view, plus focus and the active-board rule.
- **Do** set every label, count, and metadata string in 11px uppercase mono at 0.14em tracking.
- **Do** apply `tabular-nums slashed-zero` to any number that appears in a scannable column.
- **Do** resolve type from the platform stacks (`--font-serif`, `--font-sans`, `--font-mono`).
- **Do** land spacing on the 8px grid, using 4px only for micro-adjustments.
- **Do** raise shadow alpha substantially in dark mode; the light-mode values vanish on near-black.
- **Do** honor `.reduce-motion` and `@media (hover: none)` — both are already wired, and new motion
  must pass through them.
- **Do** keep the tonal stack in order: Cool Stone page → Putty 100 column → Paper card.
- **Do** preserve the 44px mobile touch minimum (48px on coarse-pointer iPad).

### Don't:

- **Don't** load a webfont. Not Google Fonts, not self-hosted, not an icon font. This is absolute.
- **Don't** introduce a second brand color. Semantic pigments are the only additional hues, and only
  where they carry meaning.
- **Don't** remap, restyle, or re-theme the seven board dot hexes — they are persisted user data.
- **Don't** put a serif below h3, or a second label style anywhere.
- **Don't** give a resting surface a heavy shadow. Elevation is a response to interaction.
- **Don't** introduce a warm neutral, a cream, or a sepia; every neutral in this system leans cool.
- **Don't** use pure black or pure white for text — Graphite (`#13141B`) and Paper are the endpoints.
- **Don't** remove a focus outline. Every interactive element gets the 2px Ink Indigo ring at 2px
  offset.
- **Don't** lock the viewport or disable pinch-zoom to solve an iOS input-zoom problem; the 16px
  input font-size already solves it.
- **Don't** use a hard 0px corner, or an organic/blob shape.
