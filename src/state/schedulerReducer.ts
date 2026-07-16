import { addDays } from '../lib/date';
import type { Employee, Shift } from '../lib/types';

export type SchedulerStatus = 'loading' | 'error' | 'ready';

export interface SchedulerState {
  status: SchedulerStatus;
  employees: Employee[];
  shifts: Shift[];
  /** Monday (ISO) of the week currently in view. */
  anchor: string;
  error?: string;
}

export type SchedulerAction =
  | { type: 'LOAD'; employees: Employee[]; shifts: Shift[] }
  | { type: 'LOAD_ERROR'; message: string }
  | { type: 'ADD_SHIFT'; shift: Shift }
  | { type: 'UPDATE_SHIFT'; shift: Shift }
  | { type: 'ASSIGN_SHIFT'; shiftId: string; employeeId: string | null }
  | { type: 'REMOVE_SHIFT'; shiftId: string }
  | { type: 'MOVE_WEEK'; delta: number };

export function createInitialState(anchor: string): SchedulerState {
  return { status: 'loading', employees: [], shifts: [], anchor };
}

/**
 * Pure state transition for the scheduler. Every branch returns a new object
 * (or the same reference when nothing changed) so React can rely on identity.
 */
export function schedulerReducer(
  state: SchedulerState,
  action: SchedulerAction,
): SchedulerState {
  switch (action.type) {
    case 'LOAD':
      return {
        ...state,
        status: 'ready',
        employees: action.employees,
        shifts: action.shifts,
        error: undefined,
      };

    case 'LOAD_ERROR':
      return { ...state, status: 'error', error: action.message };

    case 'ADD_SHIFT':
      return { ...state, shifts: [...state.shifts, action.shift] };

    case 'UPDATE_SHIFT':
      return {
        ...state,
        shifts: state.shifts.map((s) =>
          s.id === action.shift.id ? action.shift : s,
        ),
      };

    case 'ASSIGN_SHIFT':
      return {
        ...state,
        shifts: state.shifts.map((s) =>
          s.id === action.shiftId ? { ...s, employeeId: action.employeeId } : s,
        ),
      };

    case 'REMOVE_SHIFT': {
      const shifts = state.shifts.filter((s) => s.id !== action.shiftId);
      if (shifts.length === state.shifts.length) return state; // no-op
      return { ...state, shifts };
    }

    case 'MOVE_WEEK':
      return { ...state, anchor: addDays(state.anchor, action.delta * 7) };

    default:
      return state;
  }
}
