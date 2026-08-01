# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two audiences, both real, in this order of authority:

1. **The maintainer as daily driver.** Cascade is used every day for actual task management. Real workflow sets the requirements — if a change makes daily use worse, it is wrong regardless of how it demos.
2. **The public visitor arriving cold.** Someone who wants a capable task board without creating an account or paying a subscription. They land with no context, no onboarding call, and no support channel, so the app has to be legible on first contact and survive being figured out alone.

The two audiences are not in tension by default, but when they conflict, daily-use quality wins and the cold-arrival case is solved by making the app clearer rather than by adding guidance layers.

## Product Purpose

A kanban task manager that runs entirely in the visitor's browser. Boards hold tasks; tasks move
`todo → in-progress → done` by drag-and-drop; completed work is archived rather than deleted.

Success is a task board someone trusts enough to use daily — fast, private, and available offline —
without ever having created an account or handed their task list to anyone.

## Positioning

**Local-only by architecture, permanently.** Task data lives in the visitor's browser (IndexedDB)
and is never transmitted. There is no backend, no account system, and no sync service — and this is
a closed decision, not a current-state limitation. Accounts, server-side storage, and cloud sync are
explicitly out of scope for the life of the product.

This is the claim a neighboring task app cannot truthfully copy while operating a server. Most
privacy-forward competitors are trust-based: they *promise* not to read your data. Cascade's version
is structural — there is no server that could read it, and the MIT-licensed source can be audited to
confirm it. Every architectural decision downstream (static export, IndexedDB, JSON export/import)
is a consequence of this position rather than an independent choice.

JSON export/import is the shipped mechanism for backup and for moving data between browsers or
devices.

## Operating Context

- **Single browser profile per data set.** Data is bound to the browser's IndexedDB. It does not
  follow the visitor across devices or browsers except through explicit JSON export/import.
- **Offline and installable.** Runs without a network connection and can be installed to the home
  screen or desktop.
- **Deployed as static files.** Primary deployment is `cascade.vinny.dev` (S3 + CloudFront); also
  containerized (`Dockerfile`, nginx on port 8080) for self-hosting.
- **Keyboard-driven use is a first-class path**, not an accessibility afterthought: `N` / `Ctrl+K`
  create a task, `Ctrl+1–9` switch boards, `H` opens shortcuts, `F1` opens the guide, `Ctrl+,` opens
  settings.
- **Supported browsers:** Chrome/Chromium 90+, Firefox 88+, Safari 14+, Edge 90+, including iOS
  Safari, where touch drag-and-drop needs device-specific activation constraints.

## Capabilities and Constraints

### Confirmed capabilities

- Unlimited boards, each with a name, description, color, and icon. One board is the default board
  and cannot be deleted.
- Tasks with title, description, status, priority (`low`/`medium`/`high`), tags (max 10), due date,
  and a 0–100 progress value that is meaningful only while `in-progress`.
- Drag-and-drop between columns; move tasks between boards.
- Search and filter by text, tag, priority, status, and overdue, scoped to the current board or
  across all boards.
- Archive, manual and automatic (default: completed tasks older than 30 days; configurable 1–365).
- JSON export/import with conflict resolution.
- Share a task's details by email or clipboard.
- Due-date browser notifications (polling every 5 minutes; due-within-1-hour and overdue).
- Light/dark/system theming.
- PWA install and offline operation.

### Hard constraints — future work must not break these

- **No runtime backend.** Ships as a static export (`output: 'export'`). No SSR, no API routes, no
  server-side runtime. Any feature requiring a server is out of scope by definition.
- **No task data leaves the browser.** No analytics, telemetry, error reporting, or third-party
  tracking of any kind. Verified: no analytics, telemetry, or error-reporting library is present in
  the source.
- **WCAG 2.1 AA.** See Accessibility & Inclusion.
- **The Cascade name and `cascade.vinny.dev`.** See Brand Commitments.

### Terminology

The domain language is binding and documented in `CONTEXT.md`. In short: **board** (not list,
project, or workspace), **task** (not todo, item, or card), a board **owns** its tasks, deleting a
board **cascades** to them atomically, and an **orphaned task** is always a bug, never a valid state.

### Explicitly undecided

- **PWA / offline / installability is shipped but tradeable.** It works today and should not be
  broken casually, but it is deliberately *not* a hard constraint: a future capability is allowed to
  win a trade-off against offline support. Do not treat it as core, and do not quietly retire it
  either.

## Brand Commitments

- **Name:** Cascade. Package name is `kanban-todos`; the product name is Cascade everywhere a person
  can see it.
- **Domain:** `cascade.vinny.dev`.
- **Icon:** `public/images/cascade-icon.svg`.
- **License:** MIT. The source is public, and "audit it yourself" is an actual product argument
  rather than a footnote — keep it true.
- **Voice — binding.** The register shipped on `/about` is the standard for all future copy: short
  declaratives, concrete nouns, no hedging, no marketing inflation. "IndexedDB local storage. No
  account. No server. No tracking. Ever." Copy states what is true and stops. It does not reach for
  superlatives, and it does not soften a technical fact into a vague benefit.

## Evidence on Hand

**Real, present, and usable:**

- Public MIT-licensed source: `github.com/vscarpenter/kanban-todos` (MIT, © 2025 Cascade Task
  Management).
- Live deployment at `cascade.vinny.dev`.
- Shipped marketing surface at `/about`, plus `/install` and `/privacy` routes.
- Open-graph image: `public/images/og-image.png` (1200×630) and `og-image.svg`.
- Product icon: `public/images/cascade-icon.svg`; favicon `public/images/favicon.svg`.
- Documentation: `docs/` (user guide, getting started, installation, developer guide, API reference,
  testing guide), `openwiki/`, five ADRs in `docs/adr/`, and `CONTEXT.md` for domain language.
- Realistic sample data: `sample-export.json`.
- Test suites: Vitest unit tests and Playwright E2E specs in `e2e/`.

**Absences future work must not fabricate:**

- **No usage data of any kind.** The no-tracking commitment means there are no analytics, no user
  counts, no retention numbers, no funnel data. Never state or imply a usage metric.
- **No testimonials, named customers, reviews, press coverage, or case studies.** None exist. Do not
  invent them, and do not invent placeholder personas presented as real people.
- **No performance benchmarks** beyond what can be measured on demand. The "~388kB bundle" figure in
  `CLAUDE.md` is an undated claim; re-measure before repeating it.
- **PWA screenshots are declared but missing.** `public/manifest.json` references
  `/images/screenshot-mobile.png` (390×844) and `/images/screenshot-desktop.png` (1280×720), and
  neither file exists in `public/images/`. Treat these as assets to be produced, not as available
  material.
- **No pricing, plans, or commercial terms.** The product is free and MIT-licensed; there is no
  business model to describe.

## Product Principles

1. **The architecture is the privacy promise.** Prefer solutions that make a privacy violation
   structurally impossible over solutions that require trusting a policy. When a feature can only
   work with a server, the feature loses.
2. **Daily use outranks demonstration.** The board is a tool someone reaches for many times a day.
   Speed, low friction, and predictability beat anything that is impressive once and tiresome on the
   fiftieth use.
3. **Legible without a tour.** A cold visitor has no onboarding call and no support. Solve confusion
   by making the interface clearer, not by adding another explanatory layer on top of it.
4. **The user's data is theirs to take.** Export must stay complete and lossless. Anything that makes
   data harder to get out is a regression, regardless of what it makes easier inside the app.
5. **Say the true thing plainly.** In copy, in docs, and in the interface. No inflation, no hedging,
   no claims that are not verifiable in the source.

## Accessibility & Inclusion

**WCAG 2.1 AA is a hard requirement, not an aspiration.** Confirmed commitments:

- Full keyboard navigation with visible focus management, and a skip-to-main-content link.
- Screen reader support with ARIA attributes and live announcements for dynamic actions
  (`src/components/accessibility/`).
- In-app accessibility settings the visitor controls: **high contrast**, **reduce motion**, and
  **font size**. Reduce-motion is honored by real behavior — the completion confetti checks it before
  firing.
- **Pinch-to-zoom is deliberately preserved.** `maximumScale` and `userScalable` are intentionally
  left unset (WCAG 2.2 SC 1.4.4, Resize Text); the iOS input-zoom side effect is handled by setting
  `font-size: 16px` on inputs instead of by disabling zoom. Do not "fix" this by locking the
  viewport.
- Touch targets and drag-and-drop activation are tuned per device class, including iOS Safari.
