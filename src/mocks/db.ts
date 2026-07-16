import { isoToday, startOfWeek } from '../lib/date';
import type { Employee, Shift } from '../lib/types';
import { buildSeedShifts, seedEmployees } from './data';

interface Db {
  employees: Employee[];
  shifts: Shift[];
}

function freshSeed(): Db {
  return {
    employees: structuredClone(seedEmployees),
    shifts: buildSeedShifts(startOfWeek(isoToday())),
  };
}

export const db: Db = freshSeed();

let idCounter = 1000;
export function nextShiftId(): string {
  idCounter += 1;
  return `s${idCounter}`;
}

/**
 * Reset the mock database. Tests call this between cases to stay isolated;
 * pass an override to seed a specific scenario (e.g. an empty week).
 */
export function resetDb(override?: Partial<Db>): void {
  const base = freshSeed();
  db.employees = override?.employees ?? base.employees;
  db.shifts = override?.shifts ?? base.shifts;
}
