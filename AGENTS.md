# Repository Guidelines

## Project Structure & Module Organization
- `src/app/`: Next.js App Router (`layout.tsx`, `page.tsx`, `globals.css`).
- `src/components/`: React components (feature folders, PascalCase files).
- `src/lib/`: `stores/` (Zustand), `utils/`, `types/`.
- `src/test/`: test setup (`setup.ts`).
- `e2e/`: Playwright tests. Config in `playwright.config.ts`.
- Root configs: `vitest.config.ts`, `eslint.config.mjs`, `next.config.ts`.

## Build, Test, and Development Commands
- `npm run dev`: Start Next.js dev server at `http://localhost:3000`.
- `npm run build`: Clean and build production output.
- `npm start`: Serve the production build.
- `npm run lint`: Lint with ESLint (Next.js rules).
- `npm test`: Run unit tests (Vitest, jsdom).
- `npm run test:watch`: Watch mode for unit tests.
- `npm run test:e2e`: Run Playwright tests. Starts dev server per config.
- Deploy scripts (`npm run deploy*`) are maintainer-only; require AWS CLI.

## Coding Style & Naming Conventions
- TypeScript, 2-space indentation.
- Components: PascalCase files (e.g., `TaskCard.tsx`). Utilities: camelCase exports.
- Prefer module path alias `@/...` (see `vitest.config.ts` `resolve.alias`).
- Tailwind CSS v4 for styling; co-locate styles in component markup.
- Linting: ESLint with `next/core-web-vitals` + TypeScript. Fix warnings before PR.

## Testing Guidelines
- Framework: Vitest + Testing Library (jsdom). E2E: Playwright.
- Unit tests near code or in `__tests__/` with `*.test.ts(x)` names.
- Global test setup: `src/test/setup.ts` (mocks, jsdom helpers).
- Examples:
  - Run unit tests: `npm test`
  - Run a single file: `vitest run src/lib/utils/__tests__/cn.test.ts`
  - E2E locally: `npm run test:e2e`

## Commit & Pull Request Guidelines
- Prefer Conventional Commits: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`.
- Write concise, imperative messages; include scope when helpful.
- PRs must:
  - Describe changes and rationale; link issues.
  - Include screenshots/GIFs for UI changes.
  - Pass `lint`, `test`, and update/add tests as needed.
  - Note any deploy or config impacts.

## Security & Configuration Tips
- Do not commit secrets. Deploy scripts assume local AWS credentials.
- App stores data locally; avoid adding server-side state without discussion.
