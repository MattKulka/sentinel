import { describe, expect, it } from 'vitest';
import { conflictPairs, detectConflicts } from './conflicts';
import type { Shift } from './types';

let seq = 0;
function shift(partial: Partial<Shift> = {}): Shift {
  seq += 1;
  return {
    id: partial.id ?? `s${seq}`,
    employeeId: 'employeeId' in partial ? (partial.employeeId ?? null) : 'e1',
    day: partial.day ?? '2026-07-13',
    startMinutes: partial.startMinutes ?? 9 * 60,
    endMinutes: partial.endMinutes ?? 12 * 60,
    title: partial.title ?? 'Shift',
  };
}

describe('detectConflicts', () => {
  it('returns an empty set for no shifts', () => {
    expect(detectConflicts([])).toEqual(new Set());
  });

  it('returns an empty set for a single shift', () => {
    expect(detectConflicts([shift({ id: 'a' })])).toEqual(new Set());
  });

  it('flags two overlapping shifts for the same employee on the same day', () => {
    const a = shift({ id: 'a', startMinutes: 9 * 60, endMinutes: 12 * 60 });
    const b = shift({ id: 'b', startMinutes: 11 * 60, endMinutes: 13 * 60 });
    expect(detectConflicts([a, b])).toEqual(new Set(['a', 'b']));
  });

  it('does NOT flag shifts that merely touch at a boundary (half-open)', () => {
    // 9–12 and 12–14: the first ends exactly when the second begins.
    const a = shift({ id: 'a', startMinutes: 9 * 60, endMinutes: 12 * 60 });
    const b = shift({ id: 'b', startMinutes: 12 * 60, endMinutes: 14 * 60 });
    expect(detectConflicts([a, b])).toEqual(new Set());
  });

  it('flags identical shifts as conflicting', () => {
    const a = shift({ id: 'a' });
    const b = shift({ id: 'b' });
    expect(detectConflicts([a, b])).toEqual(new Set(['a', 'b']));
  });

  it('does NOT flag overlapping times on different days', () => {
    const a = shift({ id: 'a', day: '2026-07-13' });
    const b = shift({ id: 'b', day: '2026-07-14' });
    expect(detectConflicts([a, b])).toEqual(new Set());
  });

  it('does NOT flag overlapping times for different employees', () => {
    const a = shift({ id: 'a', employeeId: 'e1' });
    const b = shift({ id: 'b', employeeId: 'e2' });
    expect(detectConflicts([a, b])).toEqual(new Set());
  });

  it('never flags unassigned shifts, even when identical', () => {
    const a = shift({ id: 'a', employeeId: null });
    const b = shift({ id: 'b', employeeId: null });
    expect(detectConflicts([a, b])).toEqual(new Set());
  });

  it('does not conflict an assigned shift with an overlapping unassigned one', () => {
    const a = shift({ id: 'a', employeeId: 'e1' });
    const b = shift({ id: 'b', employeeId: null });
    expect(detectConflicts([a, b])).toEqual(new Set());
  });

  it('flags a fully contained shift and its container', () => {
    const outer = shift({
      id: 'outer',
      startMinutes: 9 * 60,
      endMinutes: 17 * 60,
    });
    const inner = shift({
      id: 'inner',
      startMinutes: 12 * 60,
      endMinutes: 13 * 60,
    });
    expect(detectConflicts([outer, inner])).toEqual(
      new Set(['outer', 'inner']),
    );
  });

  it('flags every shift involved in a multi-way overlap', () => {
    const all = shift({ id: 'all', startMinutes: 9 * 60, endMinutes: 17 * 60 });
    const morning = shift({
      id: 'am',
      startMinutes: 10 * 60,
      endMinutes: 11 * 60,
    });
    const evening = shift({
      id: 'pm',
      startMinutes: 16 * 60,
      endMinutes: 18 * 60,
    });
    expect(detectConflicts([all, morning, evening])).toEqual(
      new Set(['all', 'am', 'pm']),
    );
  });

  it('flags only the conflicting subset, leaving clean shifts out', () => {
    const a = shift({ id: 'a', startMinutes: 9 * 60, endMinutes: 12 * 60 });
    const b = shift({ id: 'b', startMinutes: 11 * 60, endMinutes: 13 * 60 });
    const clean = shift({
      id: 'c',
      startMinutes: 14 * 60,
      endMinutes: 15 * 60,
    });
    expect(detectConflicts([a, b, clean])).toEqual(new Set(['a', 'b']));
  });
});

describe('conflictPairs', () => {
  it('returns the overlapping id pairs (order-stable)', () => {
    const a = shift({ id: 'a', startMinutes: 9 * 60, endMinutes: 12 * 60 });
    const b = shift({ id: 'b', startMinutes: 11 * 60, endMinutes: 13 * 60 });
    expect(conflictPairs([a, b])).toEqual([['a', 'b']]);
  });

  it('returns an empty array when nothing overlaps', () => {
    const a = shift({ id: 'a', startMinutes: 9 * 60, endMinutes: 12 * 60 });
    const b = shift({ id: 'b', startMinutes: 12 * 60, endMinutes: 13 * 60 });
    expect(conflictPairs([a, b])).toEqual([]);
  });
});
