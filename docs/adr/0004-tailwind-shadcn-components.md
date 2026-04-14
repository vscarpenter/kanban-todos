# ADR-0004: Tailwind CSS v4 + shadcn/ui Component Library

**Status:** Accepted  
**Date:** 2024-01-15

## Context

The app needs a consistent, accessible UI with interactive components (dialogs, dropdowns,
popovers, tooltips) and responsive layout support. We want to move fast without building
a design system from scratch, while retaining full control over styling — no black-box
component library that fights customisation.

Options considered:
- **CSS Modules + custom components** — maximum control but significant time investment for accessible components
- **Material UI / Chakra UI** — pre-built accessible components but opinionated design tokens and heavy bundle sizes
- **Tailwind + headless UI (Radix/shadcn)** — utility-first styling with unstyled, accessible primitives
- **Tailwind + shadcn/ui** — headless Radix primitives with copy-owned Tailwind-styled components

## Decision

Use **Tailwind CSS v4** for utility-first styling combined with **shadcn/ui** for interactive
components. shadcn/ui components are copied into the codebase (`src/components/ui/`) rather
than installed as a dependency — giving full ownership over markup, styling, and behaviour.

Tailwind v4's CSS-first configuration (via `@theme` in a `.css` file) replaces the
`tailwind.config.js` file, co-locating design tokens with the stylesheet.

## Consequences

### Positive
- **Owned components** — shadcn/ui code lives in the repo; it can be modified freely without forking a library
- **Accessible by default** — Radix UI primitives (underlying shadcn/ui) handle focus management, ARIA attributes, and keyboard navigation
- **No design system lock-in** — Tailwind utilities mean any component can be restyled without fighting CSS specificity
- **Tailwind v4 performance** — the new Rust-based engine (via Lightning CSS) is significantly faster in both dev and build
- **Reduced bundle size** — only used utilities are emitted; no unused component styles shipped

### Negative
- **shadcn/ui components are manually updated** — because they are copied rather than installed, upstream fixes and improvements must be ported manually
- **Tailwind v4 is newer** — the ecosystem (plugins, third-party integrations) is less mature than v3; some community resources still reference v3 APIs
- **Utility class verbosity** — complex components accumulate long `className` strings; `cn()` helper and component extraction are required to keep JSX readable
- **CSS-first config learning curve** — Tailwind v4's `@theme` approach differs meaningfully from the familiar `tailwind.config.js` pattern
