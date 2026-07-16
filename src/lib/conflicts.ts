import type { Shift } from './types';

/**
 * Two shifts conflict when they belong to the **same assigned employee**, fall
 * on the **same day**, and their `[start, end)` intervals **overlap**.
 *
 * Overlap uses strict inequalities so that touching boundaries do not conflict:
 * a 9–12 shift and a 12–14 shift are back-to-back, not a double-booking.
 * Unassigned shifts (`employeeId === null`) never conflict — there is no person
 * to double-book.
 */
function overlaps(a: Shift, b: Shift): boolean {
  if (a.employeeId === null || b.employeeId === null) return false;
  if (a.employeeId !== b.employeeId) return false;
  if (a.day !== b.day) return false;
  return a.startMinutes < b.endMinutes && b.startMinutes < a.endMinutes;
}

/**
 * Ids of every shift involved in at least one conflict.
 *
 * O(n²) pairwise comparison. At a single team's weekly scale (tens of shifts)
 * this is trivially fast and far more readable than an interval tree; noted so
 * a future maintainer doesn't mistake it for an oversight.
 */
export function detectConflicts(shifts: readonly Shift[]): Set<string> {
  const conflicting = new Set<string>();
  for (let i = 0; i < shifts.length; i += 1) {
    for (let j = i + 1; j < shifts.length; j += 1) {
      const a = shifts[i]!;
      const b = shifts[j]!;
      if (overlaps(a, b)) {
        conflicting.add(a.id);
        conflicting.add(b.id);
      }
    }
  }
  return conflicting;
}

/** Every overlapping `[idA, idB]` pair, in input order — useful for messaging. */
export function conflictPairs(shifts: readonly Shift[]): [string, string][] {
  const pairs: [string, string][] = [];
  for (let i = 0; i < shifts.length; i += 1) {
    for (let j = i + 1; j < shifts.length; j += 1) {
      const a = shifts[i]!;
      const b = shifts[j]!;
      if (overlaps(a, b)) pairs.push([a.id, b.id]);
    }
  }
  return pairs;
}
