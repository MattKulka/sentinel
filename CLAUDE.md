# CLAUDE.md — Sentinel

Team shift-scheduler React app. **The real deliverable is the testing pyramid + CI/CD**, not the feature set.

## Commands (pnpm only — npm is broken on this machine)

| Task                               | Command              |
| ---------------------------------- | -------------------- |
| Dev server (port **5182**, strict) | `pnpm dev`           |
| Unit + integration tests           | `pnpm test`          |
| Tests with coverage                | `pnpm test:coverage` |
| E2E (Playwright, 3 browsers)       | `pnpm e2e`           |
| Lint                               | `pnpm lint`          |
| Typecheck                          | `pnpm typecheck`     |
| Format                             | `pnpm format`        |
| Build                              | `pnpm build`         |

## Conventions

- **TypeScript strict, no `any`** (ESLint enforces `@typescript-eslint/no-explicit-any: error`).
- **TDD**: write the failing test first, especially for `src/lib/**` and `src/state/**`.
- Business logic lives in `src/lib/` (pure) and `src/state/` (reducer) and carries a **~90% coverage gate** (vitest thresholds fail the build on drop).
- **MSW** backs the API in dev and tests — no real backend.
- Integration tests query by **role/label** (behavior, not implementation).
- **Commits: no Claude co-author trailer.** Conventional-commit style, commit per task.

## Layout

- `src/lib/` — date math, conflict detection, time helpers (pure, unit-tested).
- `src/state/` — scheduler reducer.
- `src/hooks/useScheduler.ts` — fetch + useReducer data hook.
- `src/mocks/` — MSW handlers/data (`server.ts` for tests, `browser.ts` for dev/E2E).
- `src/components/` — WeekView, ShiftCard, ShiftDialog, states.
- `src/test/` — Vitest setup + render helpers.
- `e2e/` — Playwright specs + axe scans.

See `docs/plans/` for the design and implementation plan.
