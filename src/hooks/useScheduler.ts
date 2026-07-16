import { useCallback, useEffect, useMemo, useReducer } from 'react';
import {
  createShift,
  deleteShift,
  fetchEmployees,
  fetchShifts,
  patchShift,
  type NewShift,
} from '../api/client';
import { detectConflicts } from '../lib/conflicts';
import { isoToday, startOfWeek } from '../lib/date';
import type { Shift } from '../lib/types';
import {
  createInitialState,
  schedulerReducer,
} from '../state/schedulerReducer';

/**
 * Owns all scheduler state: loads the mock API, exposes typed actions that keep
 * the server and local state in sync, and derives the current conflict set.
 * Deliberately hand-rolled (fetch + useReducer) rather than a data-fetching
 * library — see TESTING.md for the rationale.
 */
export function useScheduler() {
  const [state, dispatch] = useReducer(
    schedulerReducer,
    startOfWeek(isoToday()),
    createInitialState,
  );

  const load = useCallback(async () => {
    try {
      const [employees, shifts] = await Promise.all([
        fetchEmployees(),
        fetchShifts(),
      ]);
      dispatch({ type: 'LOAD', employees, shifts });
    } catch (err) {
      dispatch({
        type: 'LOAD_ERROR',
        message: err instanceof Error ? err.message : 'Failed to load',
      });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const addShift = useCallback(async (input: NewShift) => {
    const shift = await createShift(input);
    dispatch({ type: 'ADD_SHIFT', shift });
    return shift;
  }, []);

  const assignShift = useCallback(
    async (shiftId: string, employeeId: string | null) => {
      await patchShift(shiftId, { employeeId });
      dispatch({ type: 'ASSIGN_SHIFT', shiftId, employeeId });
    },
    [],
  );

  const updateShift = useCallback(async (shift: Shift) => {
    const updated = await patchShift(shift.id, shift);
    dispatch({ type: 'UPDATE_SHIFT', shift: updated });
  }, []);

  const removeShift = useCallback(async (shiftId: string) => {
    await deleteShift(shiftId);
    dispatch({ type: 'REMOVE_SHIFT', shiftId });
  }, []);

  const moveWeek = useCallback((delta: number) => {
    dispatch({ type: 'MOVE_WEEK', delta });
  }, []);

  const conflicts = useMemo(
    () => detectConflicts(state.shifts),
    [state.shifts],
  );

  return {
    state,
    conflicts,
    reload: load,
    addShift,
    assignShift,
    updateShift,
    removeShift,
    moveWeek,
  };
}
