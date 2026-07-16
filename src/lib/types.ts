/** A person who can be assigned to shifts. */
export interface Employee {
  id: string;
  name: string;
  /** CSS color used to tint the employee's shift cards. */
  color: string;
  role?: string;
}

/**
 * A block of work on a single civil day. Times are minutes from midnight and
 * describe the half-open interval `[startMinutes, endMinutes)`.
 */
export interface Shift {
  id: string;
  /** `null` while the shift is unassigned. */
  employeeId: string | null;
  /** Civil date, `YYYY-MM-DD`. */
  day: string;
  startMinutes: number;
  endMinutes: number;
  title: string;
}
