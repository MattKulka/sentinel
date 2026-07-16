import { describe, expect, it } from 'vitest';
import {
  createInitialState,
  schedulerReducer,
  type SchedulerState,
} from './schedulerReducer';
import type { Employee, Shift } from '../lib/types';

const employees: Employee[] = [
  { id: 'e1', name: 'Ada', color: '#f00' },
  { id: 'e2', name: 'Grace', color: '#0f0' },
];

function makeShift(over: Partial<Shift> = {}): Shift {
  return {
    id: 'a',
    employeeId: 'e1',
    day: '2026-07-13',
    startMinutes: 540,
    endMinutes: 720,
    title: 'Open',
    ...over,
  };
}

function ready(shifts: Shift[] = []): SchedulerState {
  return {
    status: 'ready',
    employees,
    shifts,
    anchor: '2026-07-13',
  };
}

describe('createInitialState', () => {
  it('starts in the loading state anchored to the given Monday', () => {
    const state = createInitialState('2026-07-13');
    expect(state).toEqual({
      status: 'loading',
      employees: [],
      shifts: [],
      anchor: '2026-07-13',
    });
  });
});

describe('schedulerReducer', () => {
  it('LOAD moves to ready and stores employees + shifts', () => {
    const start = createInitialState('2026-07-13');
    const next = schedulerReducer(start, {
      type: 'LOAD',
      employees,
      shifts: [makeShift()],
    });
    expect(next.status).toBe('ready');
    expect(next.employees).toEqual(employees);
    expect(next.shifts).toHaveLength(1);
  });

  it('LOAD_ERROR moves to the error state with a message', () => {
    const start = createInitialState('2026-07-13');
    const next = schedulerReducer(start, {
      type: 'LOAD_ERROR',
      message: 'boom',
    });
    expect(next.status).toBe('error');
    expect(next.error).toBe('boom');
  });

  it('ADD_SHIFT appends without mutating the previous state', () => {
    const prev = ready([makeShift({ id: 'a' })]);
    const next = schedulerReducer(prev, {
      type: 'ADD_SHIFT',
      shift: makeShift({ id: 'b' }),
    });
    expect(next.shifts.map((s) => s.id)).toEqual(['a', 'b']);
    expect(prev.shifts).toHaveLength(1); // unchanged
  });

  it('UPDATE_SHIFT replaces the matching shift by id', () => {
    const prev = ready([makeShift({ id: 'a', title: 'Old' })]);
    const next = schedulerReducer(prev, {
      type: 'UPDATE_SHIFT',
      shift: makeShift({ id: 'a', title: 'New' }),
    });
    expect(next.shifts[0]?.title).toBe('New');
  });

  it('UPDATE_SHIFT leaves other shifts untouched', () => {
    const prev = ready([
      makeShift({ id: 'a', title: 'Keep' }),
      makeShift({ id: 'b', title: 'Old' }),
    ]);
    const next = schedulerReducer(prev, {
      type: 'UPDATE_SHIFT',
      shift: makeShift({ id: 'b', title: 'New' }),
    });
    expect(next.shifts.map((s) => s.title)).toEqual(['Keep', 'New']);
  });

  it('ASSIGN_SHIFT sets the employee on the target shift', () => {
    const prev = ready([makeShift({ id: 'a', employeeId: null })]);
    const next = schedulerReducer(prev, {
      type: 'ASSIGN_SHIFT',
      shiftId: 'a',
      employeeId: 'e2',
    });
    expect(next.shifts[0]?.employeeId).toBe('e2');
  });

  it('ASSIGN_SHIFT can unassign by passing null', () => {
    const prev = ready([makeShift({ id: 'a', employeeId: 'e1' })]);
    const next = schedulerReducer(prev, {
      type: 'ASSIGN_SHIFT',
      shiftId: 'a',
      employeeId: null,
    });
    expect(next.shifts[0]?.employeeId).toBeNull();
  });

  it('ASSIGN_SHIFT leaves other shifts untouched', () => {
    const prev = ready([
      makeShift({ id: 'a', employeeId: 'e1' }),
      makeShift({ id: 'b', employeeId: null }),
    ]);
    const next = schedulerReducer(prev, {
      type: 'ASSIGN_SHIFT',
      shiftId: 'b',
      employeeId: 'e2',
    });
    expect(next.shifts.map((s) => s.employeeId)).toEqual(['e1', 'e2']);
  });

  it('REMOVE_SHIFT drops the matching shift', () => {
    const prev = ready([makeShift({ id: 'a' }), makeShift({ id: 'b' })]);
    const next = schedulerReducer(prev, { type: 'REMOVE_SHIFT', shiftId: 'a' });
    expect(next.shifts.map((s) => s.id)).toEqual(['b']);
  });

  it('REMOVE_SHIFT of an unknown id is a no-op (same reference)', () => {
    const prev = ready([makeShift({ id: 'a' })]);
    const next = schedulerReducer(prev, {
      type: 'REMOVE_SHIFT',
      shiftId: 'nope',
    });
    expect(next).toBe(prev);
  });

  it('MOVE_WEEK shifts the anchor by whole weeks', () => {
    const prev = ready();
    expect(schedulerReducer(prev, { type: 'MOVE_WEEK', delta: 1 }).anchor).toBe(
      '2026-07-20',
    );
    expect(schedulerReducer(prev, { type: 'MOVE_WEEK', delta: -1 }).anchor).toBe(
      '2026-07-06',
    );
  });

  it('returns the same reference for an unknown action', () => {
    const prev = ready();
    // @ts-expect-error exercising the exhaustive default branch
    expect(schedulerReducer(prev, { type: 'WAT' })).toBe(prev);
  });
});
