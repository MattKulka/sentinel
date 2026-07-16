/**
 * Time-of-day helpers. Times are represented as integer minutes from midnight
 * (0–1439), which keeps all arithmetic exact and timezone-free.
 */

const MINUTES_PER_DAY = 24 * 60;

function assertValidMinutes(minutes: number): void {
  if (!Number.isInteger(minutes) || minutes < 0 || minutes >= MINUTES_PER_DAY) {
    throw new RangeError(`minutes out of range: ${minutes}`);
  }
}

/** `540` → `"9:00 AM"`. Throws if `minutes` is not in `[0, 1440)`. */
export function minutesToLabel(minutes: number): string {
  assertValidMinutes(minutes);
  const hours24 = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const period = hours24 < 12 ? 'AM' : 'PM';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12}:${String(mins).padStart(2, '0')} ${period}`;
}

/** `540` → `"09:00"` (the value format of an `<input type="time">`). */
export function minutesToInputValue(minutes: number): string {
  assertValidMinutes(minutes);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/** `"09:00"` → `540`. Throws on anything that is not a valid 24h `HH:MM`. */
export function parseTimeInput(value: string): number {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) {
    throw new RangeError(`invalid time value: ${JSON.stringify(value)}`);
  }
  const hours = Number(match[1]);
  const mins = Number(match[2]);
  if (hours > 23 || mins > 59) {
    throw new RangeError(`invalid time value: ${JSON.stringify(value)}`);
  }
  return hours * 60 + mins;
}

/** Human-friendly length of a shift, e.g. `"1h 30m"`, `"3h"`, `"45m"`. */
export function durationLabel(
  startMinutes: number,
  endMinutes: number,
): string {
  const total = endMinutes - startMinutes;
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}
