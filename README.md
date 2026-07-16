# Sentinel

A team **shift scheduler** — create shifts, assign people, and catch double-bookings
in a week view. The app is deliberately modest; the **testing pyramid and CI/CD
pipeline are the product.** This repo is a showcase of an SDET-minded, industry-standard
front-end testing stack.

[![CI](https://github.com/MattKulka/sentinel/actions/workflows/ci.yml/badge.svg)](https://github.com/MattKulka/sentinel/actions/workflows/ci.yml)
![coverage](https://raw.githubusercontent.com/MattKulka/sentinel/main/badges/coverage.svg)
[![Playwright](https://img.shields.io/badge/E2E-Playwright%20%C3%97%203%20browsers-2EAD33?logo=playwright&logoColor=white)](https://playwright.dev)

> **Live demo:** **[sentinel-eight-azure.vercel.app](https://sentinel-eight-azure.vercel.app)** — fully functional, backed by MSW (no server).

---

## Why this exists

Most portfolios show apps; few show apps **tested the way teams actually test**.
Sentinel pairs a real (small) product with the full pyramid — unit, integration, and
E2E — and a CI pipeline that **gates merges** on lint, types, coverage, build, and
cross-browser E2E. See **[TESTING.md](TESTING.md)** for the strategy and the
deliberate trade-offs, and **[INTERVIEW-NOTES.md](INTERVIEW-NOTES.md)** for the
talking points behind it.

## The testing pyramid

| Layer           | Tooling                              | What it covers                                                                                                                                            |
| --------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Unit**        | Vitest                               | All business logic — conflict detection, date math, time formatting, the reducer — edge-case first. Coverage gated at **90%** on `src/lib` + `src/state`. |
| **Integration** | Vitest · React Testing Library · MSW | Components exercised through real user behavior (queried by role/label) against a mocked API.                                                             |
| **E2E**         | Playwright · axe-core                | Happy path + edge cases across **Chromium, Firefox, WebKit**, with an accessibility scan per page.                                                        |

## Tech stack

React 19 · TypeScript (strict, no `any`) · Vite · Vitest · React Testing Library ·
MSW · Playwright · `@axe-core/playwright` · GitHub Actions.

## Getting started

```bash
pnpm install
pnpm dev            # http://localhost:5182 (MSW mocks the API — no backend needed)
```

## Scripts

| Command                        | What it does                         |
| ------------------------------ | ------------------------------------ |
| `pnpm dev`                     | Dev server on port 5182              |
| `pnpm test`                    | Unit + integration tests (Vitest)    |
| `pnpm test:coverage`           | Tests with coverage + threshold gate |
| `pnpm e2e`                     | Playwright E2E across 3 browsers     |
| `pnpm lint` / `pnpm typecheck` | ESLint / `tsc` strict                |
| `pnpm build`                   | Production build                     |

## Project layout

```
src/
  lib/          pure business logic (date, time, conflict detection) + unit tests
  state/        scheduler reducer + unit tests
  hooks/        useScheduler (fetch + useReducer) + MSW integration tests
  api/          typed fetch client
  mocks/        MSW handlers, seed data, in-memory db
  components/   WeekView, ShiftCard, ShiftDialog, WeekNav, state views (+ tests)
  test/         Vitest setup + render helpers
e2e/            Playwright specs + axe scans
```

## Documentation

- **[TESTING.md](TESTING.md)** — test strategy, the pyramid, what was and wasn't tested and why.
- **[ARCHITECTURE.md](ARCHITECTURE.md)** — conflict-detection algorithm and state model.
- **[INTERVIEW-NOTES.md](INTERVIEW-NOTES.md)** — how to talk through the testing decisions.
