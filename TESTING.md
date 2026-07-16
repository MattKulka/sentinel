# Testing Strategy

Sentinel exists to demonstrate how I test a React application. The product (a shift
scheduler) is intentionally small so the **testing and the pipeline** can be the
focus. This document explains the strategy, the trade-offs, and — just as
importantly — what I deliberately chose _not_ to test and why.

## The pyramid, and where the weight sits

```
        ╱  E2E (Playwright × 3 browsers)  ╲      few, high-value, cross-browser
      ╱   Integration (RTL + MSW)          ╲     behavior of real components
    ╱     Unit (Vitest)                      ╲   all business logic, edge-case first
```

I put the **most** tests and the **hardest** coverage bar on the bottom layer,
because that is where the logic lives and where tests are fastest and least
brittle. E2E is kept deliberately thin — enough to prove the wiring works in a real
browser, not so much that the suite becomes slow and flaky.

| Layer       | Tool               | Count          | What it proves                                                                                    |
| ----------- | ------------------ | -------------- | ------------------------------------------------------------------------------------------------- |
| Unit        | Vitest             | ~55            | Conflict detection, date math, time formatting and the reducer are correct, including edge cases. |
| Integration | Vitest + RTL + MSW | ~26            | Components behave correctly for a user, against a realistic (mocked) API.                         |
| E2E         | Playwright + axe   | 8 × 3 browsers | The built app works end-to-end and is accessible in Chromium, Firefox, and WebKit.                |

## Coverage

Coverage is a **floor, not a goal.** The gate is enforced only where it is
meaningful — the pure logic in `src/lib` and `src/state` must stay at **90%+**
(they currently sit at 100%). Chasing a single global number tends to produce tests
that assert implementation details just to touch a line; gating the logic layer
instead keeps the incentive pointed at the code most likely to hide a bug.

Current: **`lib` 100% · `state` 100% · `hooks` ~97% · `api` ~94%** (thresholds in
[`vite.config.ts`](vite.config.ts) fail the build if `lib`/`state` regress).

## Principles I follow

**Test behavior, not implementation.** Integration tests query the DOM the way a
user (or assistive tech) would — `getByRole`, `getByLabelText` — never by test id or
CSS class. A refactor that preserves behavior should not break a single test. The
conflict-warning test, for example, asserts that _both cards show a conflict badge_
after an overlapping shift is created — it never inspects component state.

**Watch the test fail first.** Every unit was written red-first. This caught a real
bug in my own test helper: `partial.employeeId ?? 'e1'` silently turned an explicit
`null` (unassigned) into an assigned employee, which would have made the
"unassigned never conflicts" test pass for the wrong reason. Seeing it fail is the
only way to know a test tests what you think it does.

**Edge cases are the point.** Conflict detection is covered for touching boundaries
(9–12 and 12–14 do _not_ conflict — intervals are half-open `[start, end)`),
containment, multi-way overlaps, different days, different employees, and unassigned
shifts. Date math is covered across month and year boundaries. This is the SDET
habit: enumerate the boundaries before writing the implementation.

**A mock you don't reset is a shared-state bug.** MSW runs from an in-memory `db`
that is reset after every test ([`src/test/setup.ts`](src/test/setup.ts)), and
`onUnhandledRequest: 'error'` makes any un-mocked call a test failure rather than a
silent pass.

## Keeping E2E from being flaky

Flaky E2E is worse than no E2E — it trains the team to ignore red. The measures here:

- **Deterministic backend.** MSW _is_ the backend, in the browser, in every build.
  E2E never touches a network or a database, so there is no external source of
  non-determinism.
- **No arbitrary waits.** Tests use Playwright's web-first assertions
  (`await expect(locator).toBeVisible()`) which auto-retry. There is not a single
  `waitForTimeout` in the suite.
- **Resilient locators.** Everything is found by role/label, so cosmetic markup
  changes don't cascade into E2E failures.
- **Date-independent.** The app anchors to the real current week, so the specs drive
  the UI _relative_ to whatever week is in view (navigate, then assert the empty
  state) rather than hard-coding calendar dates that would rot.
- **Retries in CI only.** `retries: 2` on CI absorbs genuine infrastructure blips
  without masking a locally reproducible failure.

## What I deliberately did NOT test, and why

- **No visual-regression snapshots.** Cross-OS pixel diffs (font hinting,
  antialiasing) are the single largest source of E2E flake, and they gate merges on
  cosmetic noise. Accessibility scanning (axe) and behavioral assertions give me the
  confidence that matters without the maintenance tax. If a design system with
  stable rendering were in play, I'd revisit this.
- **No tests for the mock layer itself.** `src/mocks` is test infrastructure, not
  product code, so it's excluded from coverage. Testing your test doubles is a
  smell.
- **No unit tests for trivial presentational wrappers.** They are exercised
  end-to-end by the integration and E2E layers; unit-testing markup with no logic
  would assert implementation, not behavior.

## Two architecture choices that serve the tests

- **Hand-rolled data hook instead of a fetching library.** `useScheduler` is
  `fetch` + `useReducer`. This keeps the interesting logic (loading/error states,
  optimistic-free server sync) as _our_ code under test, and keeps the story honest:
  we test what we wrote, not TanStack Query's internals.
- **Pure logic, isolated.** Conflict detection, date, and time are pure functions
  with zero React or DOM dependencies, so they're tested at microsecond speed with
  plain assertions and gated hardest.

## Running it

```bash
pnpm test            # unit + integration (watch: pnpm test:watch)
pnpm test:coverage   # with the threshold gate
pnpm e2e             # Playwright across 3 browsers
pnpm e2e:report      # open the last HTML report
```

CI runs all of it on every PR and push to `main`; a failing test, a coverage
regression on the logic layer, or an accessibility violation blocks the merge.
