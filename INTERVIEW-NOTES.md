# Interview Notes

Talking points for walking an interviewer through Sentinel. These are the questions
I expect, with the answers this codebase lets me give from real code rather than
theory.

---

### "Walk me through your testing strategy."

I start from a simple principle: **push tests down to the cheapest layer that can
still prove the thing.** Business logic — conflict detection, date math, the reducer
— is pure and lives in `src/lib` and `src/state`, so it's unit-tested exhaustively
and gated at 90%+ coverage. Components are tested through user behavior with
Testing Library against an MSW-mocked API. Then a thin layer of Playwright E2E
proves the built app actually works across three browser engines and is accessible.

The shape is a real pyramid: ~55 unit, ~26 integration, 8 E2E specs (× 3 browsers).
Most of the value and all of the hardest coverage sits at the bottom, because that's
where bugs hide and where tests are fast and stable.

### "Unit vs integration vs E2E — when do you reach for each?"

- **Unit** when there's logic with a clear input→output contract and edge cases:
  `detectConflicts`, `startOfWeek`, the reducer. Fast, deterministic, and I can
  enumerate boundaries cheaply.
- **Integration** when the question is _"does the user get the right behavior?"_ —
  e.g. creating an overlapping shift surfaces a conflict badge on both cards. I
  render the real component tree with a mocked network and assert via roles/labels.
  This is my highest-ROI layer for a UI.
- **E2E** for the handful of critical journeys that must work in a real browser:
  load, create, assign, conflict, empty week — plus an axe scan per page. I keep it
  small on purpose; E2E is the most expensive and most flake-prone layer, so it
  proves _wiring_, not every branch.

The rule of thumb: if a bug could be caught one layer down, write it one layer down.

### "How do you keep E2E from being flaky?"

Five things, all visible in this repo:

1. **Deterministic backend** — MSW runs inside the app in every build, so E2E never
   hits a real network. No external non-determinism.
2. **No arbitrary sleeps** — only Playwright web-first assertions that auto-retry.
   Zero `waitForTimeout` in the suite.
3. **Role/label locators** — resilient to markup churn.
4. **Date-independence** — the app anchors to the current week, so specs act
   _relative_ to what's on screen instead of hard-coding dates that rot.
5. **Retries in CI only** — absorbs infra blips without hiding a real, locally
   reproducible failure.

If an E2E test is _inherently_ flaky, I treat that as a design signal — usually it
wants to be an integration test instead.

### "Why no data-fetching library like React Query?"

Deliberate. The brief showcased testing, and a hand-rolled `useScheduler`
(`fetch` + `useReducer`) keeps the interesting logic — loading/error transitions,
server-then-dispatch sync — as _my_ code under test. It keeps the narrative honest:
I'm demonstrating that I test what I write, not that a mature library is
well-tested. In production with more endpoints I'd absolutely reach for TanStack
Query; here it would have hidden the very thing I wanted to show.

### "Why did you skip visual regression?"

Cross-OS pixel snapshots are the number-one cause of E2E flake — font antialiasing
alone will fail a run between my machine and the CI runner. That noise trains people
to ignore red, which is the worst outcome for a test suite. I get the safety I
actually need from axe accessibility scans and behavioral assertions. With a
design system that renders deterministically, I'd reconsider.

### "How does the CI gate work?"

`.github/workflows/ci.yml` runs on every PR and push to `main`, in two jobs: one for
lint → typecheck → coverage → build, one for Playwright E2E across all three
browsers with the HTML report uploaded as an artifact. A failing test, a coverage
regression on the logic layer, or an accessibility violation fails the check and
blocks the merge. The green badges in the README are that pipeline.

### "Tell me about a bug your tests caught."

While writing conflict-detection tests red-first, the "unassigned shifts never
conflict" case passed when it shouldn't have — because my _test helper_ coerced an
explicit `null` employee to a real id via `?? 'e1'`. Watching it fail first is what
exposed it; a test-after would have "passed" and I'd have shipped a detector that
double-books nobody. It's the concrete argument for red-green-refactor.

### "What would you add next?"

- Contract tests against the real API schema once a backend exists (MSW handlers
  become the shared contract).
- A small set of visual snapshots _if_ a stable design system lands.
- Mutation testing (Stryker) on `src/lib` to verify the tests actually kill bugs,
  not just cover lines.
- Trace-viewer-based debugging wired into CI failures (already `trace: on-first-retry`).
