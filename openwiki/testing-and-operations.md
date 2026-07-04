# Testing & Operations

## Unit / integration tests (Vitest)

- Config: `vitest.config.ts` — jsdom environment, `@` → `src` alias, includes
  `src/**/*.{test,spec}.{ts,tsx}` (excludes `e2e/` and agent dirs), coverage via `@vitest/coverage-v8`.
  Coverage thresholds are intentionally modest today (≈55% lines/functions/statements, 50% branches;
  ~80% is the stated target).
- Global setup: `src/test/setup.ts` — polyfills `localStorage` and `PointerEvent`, mocks
  `crypto.randomUUID` → `'test-uuid-123'`, mocks `next-themes`, and mocks the `taskDB` database
  module so store tests don't hit real IndexedDB.
- Test locations (co-located `__tests__/` dirs):
  - `src/lib/utils/__tests__/` — utility coverage (security, validation, export/import, conflicts,
    search, etc.).
  - `src/lib/stores/__tests__/` — store behavior.
  - component/hook/app `__tests__/` under `src/components/`, `src/hooks/`, `src/app/`.

Run:

```bash
bun run test            # vitest run
bun run test:watch      # watch mode
bun run test:coverage   # with coverage report
```

## End-to-end tests (Playwright)

- Config: `playwright.config.ts` — specs in `./e2e`, Chromium only, `baseURL` `http://localhost:3000`,
  auto-starts `bun run dev` as the web server, 2 retries on CI.
- Specs (`e2e/*.spec.ts`) cover: app boot, archive system, board appearance/management, cross-board
  search, drag-and-drop, error handling, export/import flows, first-visit, keyboard shortcuts,
  mobile-responsive, notifications, PWA features, search filters, settings, share-task, task CRUD,
  and theme/visual. Shared setup in `e2e/fixtures.ts` and `e2e/helpers/`; behavior spec in
  `e2e/SPEC.md`.

Run: `bun run test:e2e`.

## Linting & types

- `bun run lint` → `eslint src/` (Next.js ESLint config in `eslint.config.mjs`).
- TypeScript is strict (`tsconfig.json`). There is also a `react-doctor.config.json` and inline
  `react-doctor-disable-next-line` pragmas (see `KanbanBoard.tsx`).

## Build

- `bun run build` cleans `.next` and `out`, injects build metadata env vars
  (`NEXT_PUBLIC_APP_VERSION`, `NEXT_PUBLIC_BUILD_TIME/HASH/TIMESTAMP`), and runs `next build`, which
  produces a **static export** in `./out`.
- `bun run build:analyze` runs the build with `@next/bundle-analyzer` (`ANALYZE=true`).

## Deployment

Primary target is `cascade.vinny.dev` on **S3 + CloudFront**. Scripts (see `package.json` and
`scripts/`):

- `bun run deploy` → `./scripts/deploy.sh` (single env).
- `bun run deploy:multi` / `deploy:cascade` / `deploy:all` → `./scripts/deploy-multi.sh`
  (config in `deploy-config.json` / `deploy.config.js`).
- `deploy:s3` syncs `./out` to the bucket with long cache for assets and no-cache for HTML;
  `deploy:invalidate` / `invalidate` create CloudFront invalidations.
- Security-header tooling: `security:headers:check` / `security:headers:update`
  (`scripts/*-security-headers.sh`, baseline `docs/security-headers-baseline.json`).

## Docker

`Dockerfile` is a multi-stage build: it builds the static export with Bun, then serves the prebuilt
files with **nginx** as the non-root `nginx` user on **port 8080** — there is no Next.js server in
the container. See `docker/` for nginx config and `README.md` for build/run and Kubernetes examples.

```bash
docker build -t kanban-todos:latest .
docker run -p 3000:8080 --name kanban-todos kanban-todos:latest
```

## Where to start when changing this area

- Adding a feature → add/extend the matching `e2e/*.spec.ts` and co-located unit tests; the
  `taskDB` mock in `src/test/setup.ts` covers store unit tests.
- Changing deploy behavior → `scripts/` and the `deploy*` scripts in `package.json`.
- Changing the container/runtime → `Dockerfile` and `docker/` (nginx serves static output on 8080).
