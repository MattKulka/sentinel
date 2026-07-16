# Sentinel Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Commit after each task. **No Claude co-author trailer on commits.**

**Goal:** Build a team shift-scheduler React app whose real deliverable is an exemplary automated-testing pyramid and a green GitHub Actions CI/CD pipeline with coverage + CI badges.

**Architecture:** Pure business logic (`lib/`, `state/`) is isolated and unit-tested edge-case-first. A hand-rolled `useScheduler` hook (fetch + useReducer) talks to an MSW-mocked API used in both dev and tests. Components are integration-tested via RTL behavior (roles/labels). Playwright drives E2E across 3 browsers with axe scans. CI gates merges on lint/typecheck/coverage/build/E2E.

**Tech Stack:** React 19, TypeScript strict, Vite (port 5182), Vitest, React Testing Library, MSW, Playwright, @axe-core/playwright, GitHub Actions, Codecov, Vercel. Package manager: **pnpm**.

---

## Milestone 0 — Scaffold + core logic

### Task 0.1: Scaffold Vite React-TS project
- `pnpm create vite . --template react-ts` in `~/Desktop/sentinel` (folder already git-inited, has docs/).
- Set `vite.config.ts` server.port + strictPort = 5182.
- `tsconfig` strict already on; add `noUncheckedIndexedAccess`, `noImplicitAny`.
- Install dev deps: vitest, @vitest/coverage-v8, jsdom, @testing-library/react, @testing-library/user-event, @testing-library/jest-dom, msw, eslint, prettier, @axe-core/playwright, @playwright/test, eslint-plugin-react-hooks, typescript-eslint.
- Add scripts: `dev`, `build`, `preview`, `lint`, `typecheck`, `format`, `test`, `test:coverage`, `e2e`.
- Configure vitest in `vite.config.ts` (environment jsdom, setupFiles `src/test/setup.ts`, coverage v8, thresholds on `src/lib` + `src/state` ~90%).
- **Verify:** `pnpm typecheck`, `pnpm build`. **Commit:** `chore: scaffold vite react-ts + test tooling`.

### Task 0.2: `lib/time.ts` — minutes ↔ label (TDD)
- Test cases (`src/lib/time.test.ts`): `minutesToLabel(540)` → `"9:00 AM"`; `0` → `"12:00 AM"`; `720` → `"12:00 PM"`; `1439` → `"11:59 PM"`; `parseLabel` round-trips; rejects out-of-range.
- Implement `minutesToLabel`, `parseTimeInput`, `durationLabel`.
- **Verify tests fail → implement → pass. Commit:** `feat: time label helpers with tests`.

### Task 0.3: `lib/date.ts` — week math (TDD)
- Test cases (`src/lib/date.test.ts`), Monday-based weeks:
  - `startOfWeek("2026-07-16")` (Thu) → `"2026-07-13"` (Mon).
  - `startOfWeek("2026-07-13")` → itself.
  - Sunday `"2026-07-19"` → `"2026-07-13"` (Sunday belongs to the week that started Mon).
  - `addDays("2026-07-31", 1)` → `"2026-08-01"` (month wrap).
  - `addDays("2026-12-31", 1)` → `"2027-01-01"` (year wrap).
  - `weekDays("2026-07-13")` → 7 ISO dates Mon..Sun.
  - `formatWeekRange` → `"Jul 13 – 19, 2026"`; cross-month `"Jul 27 – Aug 2, 2026"`.
  - Work in UTC to avoid TZ flake (document why).
- **Commit:** `feat: week date math with edge-case tests`.

### Task 0.4: `lib/conflicts.ts` — overlap detection (TDD, the star)
- Types in `src/lib/types.ts` (Employee, Shift).
- Test cases (`src/lib/conflicts.test.ts`):
  - Overlap: same employee/day, 9–12 & 11–13 → both flagged as conflicting.
  - **Touching boundaries** 9–12 & 12–14 → **no** conflict (half-open `[start,end)`).
  - Identical shifts → conflict.
  - Different days, same employee, overlapping times → no conflict.
  - Different employees, same day/time → no conflict.
  - Unassigned (`employeeId: null`) never conflicts (even two identical unassigned).
  - Multi-way: 9–17, 10–11, 16–18 all same employee → all three flagged.
  - Empty input → empty set. Single shift → no conflict.
  - Contained interval 9–17 & 12–13 → both flagged.
- API: `detectConflicts(shifts): Set<string>` (conflicting shift ids) + `conflictPairs(shifts)` for messaging. Pure, O(n²) acceptable at this scale (documented).
- **Commit:** `feat: shift conflict detection with SDET edge cases`.

### Task 0.5: `state/schedulerReducer.ts` (TDD)
- Actions: `LOAD`, `ADD_SHIFT`, `UPDATE_SHIFT`, `ASSIGN_SHIFT`, `REMOVE_SHIFT`, `MOVE_WEEK`.
- Test cases (`src/state/schedulerReducer.test.ts`): each action produces expected immutable next state; `ASSIGN_SHIFT` sets employeeId; `MOVE_WEEK(+1/-1)` shifts anchor by 7 days (uses `lib/date`); unknown action returns same reference; `REMOVE_SHIFT` of missing id is a no-op.
- **Commit:** `feat: scheduler reducer with tests`.

---

## Milestone 1 — Scheduler UI + integration tests

### Task 1.1: MSW handlers + seed data + test harness
- `src/mocks/data.ts` (seed employees + a few shifts incl. one conflict), `handlers.ts` (GET/POST/PATCH/DELETE `/api/employees`,`/api/shifts`), `server.ts` (setupServer), `browser.ts` (setupWorker).
- `src/test/setup.ts`: jest-dom, MSW server lifecycle (listen/reset/close), `onUnhandledRequest: 'error'`.
- `src/test/utils.tsx`: `renderWithProviders`.
- Wire MSW worker into dev in `main.tsx` (dynamic import when DEV). `pnpm msw init public`.

### Task 1.2: `api/client.ts` + `hooks/useScheduler.ts` (TDD integration)
- Typed fetch client. Hook: loads employees+shifts, exposes `state` (`status: loading|error|ready`, employees, shifts, anchor), and actions (`addShift`, `assignShift`, `updateShift`, `removeShift`, `moveWeek`) that call API + dispatch.
- Test (`useScheduler.test.tsx`) with MSW: starts loading → ready with seeded data; error handler → error status; addShift posts and appears.
- **Commit:** `feat: scheduler data hook (fetch + reducer) with MSW tests`.

### Task 1.3: State components + WeekView + ShiftCard
- `states/{Loading,Empty,Error}.tsx`; `WeekView` (7 day columns, current week), `ShiftCard` (time label, employee color, conflict badge), `WeekNav`.
- Integration test: renders 7 day headers from anchor; shows seeded shifts under correct day; conflict shift shows an alert/badge queried by role/`aria`.
- Empty-week test: MSW returns `[]` shifts → Empty state visible.
- Error test: MSW 500 → Error state with retry.
- **Commit:** `feat: week view + shift cards + states with integration tests`.

### Task 1.4: ShiftDialog (create/edit/assign) + conflict warning flow
- Accessible dialog (role=dialog, labelled, focus trap, Esc), form fields (day, start, end, title, employee select). Validation: end > start.
- Integration tests (behavior/RTL + user-event): open dialog → fill → submit → new card appears; assign employee that causes overlap → conflict warning appears on both cards; validation error when end ≤ start.
- **Commit:** `feat: shift create/assign dialog with conflict warning + tests`.

---

## Milestone 2 — E2E + a11y

### Task 2.1: Playwright config + fixtures
- `playwright.config.ts`: projects chromium/firefox/webkit, `webServer` builds+previews on 5182 (or dev), HTML reporter, trace on-first-retry, retries in CI. MSW runs in the browser build so E2E hits mocked API deterministically.
- **Commit:** `test: playwright config for 3 browsers`.

### Task 2.2: E2E happy path + edge (`e2e/scheduler.spec.ts`)
- Create shift → assign → conflict warning visible; empty-week initial state message; week navigation changes range label. Stable locators (getByRole/getByLabel), no arbitrary waits (auto-wait/web-first assertions) — document anti-flake choices.
- **Commit:** `test: e2e scheduler happy path + edge cases`.

### Task 2.3: axe scans (`e2e/a11y.spec.ts`)
- `@axe-core/playwright` scan on main view + open dialog; assert zero violations. Fix any real a11y issues found.
- **Verify:** `pnpm e2e` green locally across browsers. **Commit:** `test: axe accessibility scans per page`.

---

## Milestone 3 — CI pipeline + badges + repo

### Task 3.1: GitHub Actions `ci.yml`
- Triggers: `pull_request` + `push` to `main`. Job(s): checkout → setup-node + pnpm cache → install → `lint` → `typecheck` → `test:coverage` (upload to Codecov via codecov-action) → `build` → `e2e` (install playwright browsers, run, `upload-artifact` playwright-report). Coverage thresholds in vitest fail the job on drop.
- Validate YAML locally (`actionlint` if available, else careful review).
- **Commit:** `ci: github actions pipeline with coverage + playwright artifact`.

### Task 3.2: Create + push public GitHub repo
- `gh repo create MattKulka/sentinel --public --source . --remote origin --push` (confirm with user before pushing — outward-facing).
- Watch the Actions run; fix until green on `main`.

### Task 3.3: README with badges
- CI badge, Codecov badge, live-demo placeholder, quickstart, test commands, screenshot.
- **Commit:** `docs: readme with CI + coverage badges`.

---

## Milestone 4 — Polish + docs + deploy

### Task 4.1: Polish
- Dark mode (prefers-color-scheme + toggle), responsive (mobile week view), focus-visible, no console errors/warnings. Loading/empty/error states final pass.
- **Verify on 5182 + screenshots (light/dark, mobile).** **Commit:** `feat: dark mode, responsive, a11y polish`.

### Task 4.2: TESTING.md (centerpiece)
- Test strategy, the pyramid, what/why tested and deliberately not (no visual regression + why; hand-rolled date/hook + why), anti-flake practices, coverage philosophy.

### Task 4.3: INTERVIEW-NOTES.md + ARCHITECTURE.md
- INTERVIEW-NOTES: testing-strategy walkthrough, unit vs integration vs E2E decision guide, keeping E2E non-flaky.
- ARCHITECTURE: conflict-detection algorithm, state model, data flow.
- **Commit:** `docs: TESTING, INTERVIEW-NOTES, ARCHITECTURE`.

### Task 4.4: Deploy to Vercel + live link
- Deploy via Vercel Git integration; add live URL to README. Confirm production build serves MSW (or a static seed) so the demo works.
- **Commit:** `docs: add live demo link`.

---

## Definition of Done (verify before declaring complete)
- Green Actions pipeline on `main`; CI + coverage badges render in README.
- ~90% coverage on `lib/` + `state/`; thresholds enforced.
- Playwright passes headless across Chromium/Firefox/WebKit in CI; HTML report artifact uploaded.
- App polished: responsive, axe-clean, dark mode, loading/empty/error states, no console errors.
- TS strict, no `any`, ESLint/Prettier clean.
- TESTING.md, INTERVIEW-NOTES.md, ARCHITECTURE.md present.
