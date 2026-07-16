# Sentinel — Design Document

_Date: 2026-07-16_

## Purpose

A **team shift scheduler**: a week view where you create shifts, assign employees,
and get real-time conflict warnings when someone is double-booked. The feature set
is deliberately modest. The **testing pyramid and green CI/CD pipeline are the
product** — this repo exists to demonstrate an SDET-minded, industry-standard
testing stack (Playwright, Vitest, Testing Library, MSW, GitHub Actions, coverage
gates) on a real React app.

## Stack

- React 19 + TypeScript (strict, no `any`) + Vite (dev server on port **5182**)
- Vitest (unit) + React Testing Library (component/integration)
- MSW (Mock Service Worker) — mocks the API in **both** dev and tests
- Playwright E2E across Chromium / Firefox / WebKit + `@axe-core/playwright`
- GitHub Actions CI: lint → typecheck → unit/integration (coverage) → build → E2E
- Codecov for coverage reporting + badge; Playwright HTML report as CI artifact
- Vercel deployment (live demo link in README)

### Deliberate deviation from the brief's stack

The brief's stack lists no data-fetching library. We keep it that way: instead of
TanStack Query we hand-roll a small typed `useScheduler` hook (`fetch` + `useReducer`).
Rationale for the SDET narrative — it maximizes _our own_ logic under test and keeps
the "we test our code, not a third-party library" story clean. Documented in TESTING.md.

## Domain model

```ts
type Employee = { id: string; name: string; color: string; role?: string };
type Shift = {
  id: string;
  employeeId: string | null; // null = unassigned
  day: string; // ISO date, e.g. "2026-07-13"
  startMinutes: number; // minutes from midnight
  endMinutes: number;
  title: string;
};
```

## Core logic (the heavily-tested star)

- **`lib/date.ts`** — pure, hand-rolled: `startOfWeek`, `addDays`, `weekDays`,
  `formatWeekRange`, week navigation. Hand-rolled (not date-fns) so unit tests
  exercise our math, including month-boundary / week-wrap edge cases.
- **`lib/conflicts.ts`** — `detectConflicts(shifts)`: same employee + same day +
  overlapping `[start, end)` intervals. Edge cases: touching boundaries
  (9–12 & 12–14 = **no** conflict), identical shifts, unassigned never conflict,
  multi-way overlaps, different days.
- **`lib/time.ts`** — minutes ↔ `"9:00 AM"` label conversions.
- **`state/schedulerReducer.ts`** — pure reducer:
  `ADD/UPDATE/ASSIGN/REMOVE_SHIFT`, `MOVE_WEEK`, `LOAD`.

Coverage gate targets **~90% on `lib/` + `state/`** (thresholds in vitest config
fail the build if breached).

## Testing pyramid

| Layer       | Tool               | Covers                                                                                                                                                        |
| ----------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit        | Vitest             | all of `lib/` + reducer, edge-case-first                                                                                                                      |
| Integration | Vitest + RTL + MSW | load week, create-shift flow, assign flow, conflict warning renders, empty-week state, 500 → error state. Queries by role/label, behavior not implementation. |
| E2E         | Playwright + axe   | happy path (create → assign → conflict), empty week; axe scan per page; 3 browsers headless                                                                   |

## Data flow

`useScheduler` hook fetches `/api/employees` and `/api/shifts` (mocked by MSW in
dev + tests), holds state in `useReducer`, and exposes actions. Components render
loading / empty / error / data states. Conflict detection runs as a pure derivation
over current shifts.

## CI (gates merges)

`.github/workflows/ci.yml`: `install (pnpm cache)` → `lint` → `typecheck` →
`test` (coverage → Codecov) → `build` → `e2e` (Playwright, HTML report artifact).
Runs on every PR + push to `main`. A failing test or coverage drop fails the PR.

## Milestones

- **M0** — Scaffold (Vite 5182, TS strict, ESLint/Prettier, Vitest + RTL + MSW,
  CLAUDE.md) + `lib/` and reducer with edge-case-first unit tests.
- **M1** — Scheduler UI (week view, create/assign, conflict warning,
  loading/empty/error) with integration tests written alongside.
- **M2** — Playwright E2E + axe scans; conflict/edge cases across 3 browsers.
- **M3** — GitHub Actions pipeline + coverage gate + Codecov + Playwright artifact;
  push public repo; confirm green on `main`; badges in README.
- **M4** — Polish (a11y, states, dark mode) + TESTING.md + INTERVIEW-NOTES.md +
  ARCHITECTURE.md; deploy to Vercel; live link.

## Non-goals

No sprawling features, no real auth/backend (MSW is enough), no microservices,
no visual-regression snapshots (deliberately skipped — cross-OS pixel diffs are the
top source of CI flake; keeping the pipeline reliably green matters more for the
showcase; noted in TESTING.md).
