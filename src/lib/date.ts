/**
 * Calendar helpers over ISO date strings (`YYYY-MM-DD`).
 *
 * All arithmetic runs in **UTC** on purpose: a shift's `day` is a civil date,
 * not an instant, so anchoring to UTC keeps `startOfWeek`/`addDays` free of the
 * daylight-saving and locale drift that makes date code flaky in tests.
 */

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

function toUtc(iso: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) throw new RangeError(`invalid ISO date: ${JSON.stringify(iso)}`);
  const [, y, m, d] = match;
  return new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
}

function toIso(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** ISO date `n` days after `iso` (negative `n` goes backwards). */
export function addDays(iso: string, n: number): string {
  const date = toUtc(iso);
  date.setUTCDate(date.getUTCDate() + n);
  return toIso(date);
}

/** The Monday (ISO date) of the week containing `iso`. */
export function startOfWeek(iso: string): string {
  const date = toUtc(iso);
  const day = date.getUTCDay(); // 0 = Sunday … 6 = Saturday
  const backToMonday = (day + 6) % 7; // Mon → 0, Sun → 6
  return addDays(iso, -backToMonday);
}

/** The 7 ISO dates Monday → Sunday for the week starting at `mondayIso`. */
export function weekDays(mondayIso: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(mondayIso, i));
}

/** Full weekday name, e.g. `"Monday"`. */
export function weekdayName(iso: string): string {
  return WEEKDAYS[toUtc(iso).getUTCDay()]!;
}

/** Short heading like `"Mon 13"`. */
export function shortDayLabel(iso: string): string {
  const date = toUtc(iso);
  return `${weekdayName(iso).slice(0, 3)} ${date.getUTCDate()}`;
}

/**
 * Human range for a Monday-anchored week:
 * - same month:  `"Jul 13 – 19, 2026"`
 * - cross month: `"Jul 27 – Aug 2, 2026"`
 * - cross year:  `"Dec 28, 2026 – Jan 3, 2027"`
 */
export function formatWeekRange(mondayIso: string): string {
  const start = toUtc(mondayIso);
  const end = toUtc(addDays(mondayIso, 6));

  const sMonth = MONTHS[start.getUTCMonth()]!;
  const eMonth = MONTHS[end.getUTCMonth()]!;
  const sDay = start.getUTCDate();
  const eDay = end.getUTCDate();
  const sYear = start.getUTCFullYear();
  const eYear = end.getUTCFullYear();

  if (sYear !== eYear) {
    return `${sMonth} ${sDay}, ${sYear} – ${eMonth} ${eDay}, ${eYear}`;
  }
  if (sMonth !== eMonth) {
    return `${sMonth} ${sDay} – ${eMonth} ${eDay}, ${sYear}`;
  }
  return `${sMonth} ${sDay} – ${eDay}, ${sYear}`;
}

/** Today's civil date in `YYYY-MM-DD`, in the user's local timezone. */
export function isoToday(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
