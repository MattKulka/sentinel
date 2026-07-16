# Architecture

A tour of how Sentinel is built. The guiding idea: **keep the logic pure and
isolated so it can be tested hard, and keep the React thin around it.**

## Layers

```
components/  ─ presentational + interactive UI (WeekView, ShiftCard, ShiftDialog…)
     │  props + callbacks
hooks/useScheduler ─ owns state: fetch + useReducer, exposes actions + derived data
     │  dispatch                       │ fetch
state/schedulerReducer ─ pure      api/client ─ typed fetch wrapper
     │                                  │
lib/ (pure logic) ◄────────────────────┘   mocks/ (MSW: the "backend")
  conflicts · date · time · types
```

Data flows in one direction: components call hook actions → the hook calls the API
and dispatches → the reducer produces new state → derived values (conflicts, the
visible week) are recomputed → components re-render.

## Domain model

```ts
type Employee = { id: string; name: string; color: string; role?: string };

type Shift = {
  id: string;
  employeeId: string | null; // null = unassigned
  day: string; // civil date, "YYYY-MM-DD"
  startMinutes: number; // minutes from midnight, [0, 1440)
  endMinutes: number; // half-open end: the interval is [start, end)
  title: string;
};
```

Two decisions do a lot of work here:

- **Times are integer minutes from midnight**, not `Date` objects. All shift
  arithmetic (overlap, duration) is then exact integer math with no timezone or DST
  surface area.
- **A day is a civil date string**, not an instant. Two shifts "on Wednesday" are
  compared by their `day` field, never by wall-clock timestamps.

## Conflict detection — the core algorithm

[`src/lib/conflicts.ts`](src/lib/conflicts.ts). Two shifts conflict when they are
for the **same assigned employee**, on the **same day**, and their time intervals
**overlap**:

```ts
a.employeeId !== null &&
  a.employeeId === b.employeeId &&
  a.day === b.day &&
  a.startMinutes < b.endMinutes &&
  b.startMinutes < a.endMinutes;
```

The overlap test uses **strict** inequalities, which encodes the half-open interval
`[start, end)`: a 9:00–12:00 shift and a 12:00–14:00 shift touch at a boundary but
do **not** conflict. Unassigned shifts (`employeeId === null`) can never conflict —
there is no person to double-book.

`detectConflicts(shifts)` returns the `Set` of ids involved in _any_ conflict, so a
shift that overlaps two others is reported once and every participant in a multi-way
overlap is flagged. It's an O(n²) pairwise scan — deliberately, because a team's
weekly schedule is tens of shifts, where an interval tree would be more code and
more risk for zero perceptible benefit. That trade-off is documented at the call
site so it reads as a choice, not an oversight.

Conflicts are a **pure derivation** of the shift list (memoized in the hook), never
stored in state. There is no way for a "conflict flag" to drift out of sync with the
data, because it doesn't exist independently.

## State model

[`src/state/schedulerReducer.ts`](src/state/schedulerReducer.ts) is a pure reducer
over:

```ts
type SchedulerState = {
  status: 'loading' | 'error' | 'ready';
  employees: Employee[];
  shifts: Shift[];
  anchor: string; // Monday (ISO) of the week in view
  error?: string;
};
```

Actions: `LOAD`, `LOAD_ERROR`, `ADD_SHIFT`, `UPDATE_SHIFT`, `ASSIGN_SHIFT`,
`REMOVE_SHIFT`, `MOVE_WEEK`. Every branch returns a new object — or the _same
reference_ when nothing changed (e.g. removing a non-existent id), so React's
identity checks stay meaningful. `MOVE_WEEK` shifts `anchor` by whole weeks using
the same `addDays` helper the rest of the app uses.

## Data hook

[`src/hooks/useScheduler.ts`](src/hooks/useScheduler.ts) is the seam between React
and everything pure. It:

- loads employees and shifts in parallel on mount (→ `LOAD` / `LOAD_ERROR`),
- exposes async actions (`addShift`, `assignShift`, `updateShift`, `removeShift`)
  that call the API and then dispatch, keeping server and client in step,
- exposes `moveWeek` (client-only) and `reload` (for the error-state retry),
- derives and memoizes the conflict set from the current shifts.

It's `fetch` + `useReducer` rather than a fetching library on purpose — see
[TESTING.md](TESTING.md) and [INTERVIEW-NOTES.md](INTERVIEW-NOTES.md).

## The "backend"

[`src/mocks`](src/mocks) is a full MSW REST API (`GET/POST/PATCH/DELETE` over
`/api/employees` and `/api/shifts`) backed by an in-memory `db`. The **same
handlers** serve three contexts: unit/integration tests (Node), dev, and the
production build — including the deployed demo. There is no real server; MSW is the
architecture, which is what makes the whole app runnable and every test
deterministic.

## Rendering

Presentational components take data and callbacks as props (`WeekView`, `ShiftCard`,
`WeekNav`, the `states/` views), so they're trivial to test in isolation. `App` is
the only place that wires the hook to the components and owns the dialog's
open/create/edit state. The week grid is a CSS grid that collapses to a single
column under 820px; theming is CSS custom properties with a light default, a
`prefers-color-scheme` dark fallback, and a manual toggle that stamps
`data-theme` on `<html>`.

## Accessibility

Baked in, not bolted on: day columns are labelled `region`s with heading names,
the dialog is a proper `role="dialog"` with `aria-modal`, focus-on-open and
Esc-to-close, conflict badges carry an accessible name, and every interactive
element is reachable and has a visible focus ring. `@axe-core/playwright` scans the
board (light **and** dark) and the open dialog on every CI run and fails the build
on any WCAG 2.1 A/AA violation — which is how the duration-text and dark-button
contrast issues were caught during development.
