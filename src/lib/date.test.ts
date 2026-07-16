import { describe, expect, it } from 'vitest';
import {
  addDays,
  formatWeekRange,
  isoToday,
  shortDayLabel,
  startOfWeek,
  weekDays,
  weekdayName,
} from './date';

describe('startOfWeek (Monday-based)', () => {
  it('returns the Monday of a mid-week date', () => {
    // 2026-07-16 is a Thursday.
    expect(startOfWeek('2026-07-16')).toBe('2026-07-13');
  });

  it('returns the same date when given a Monday', () => {
    expect(startOfWeek('2026-07-13')).toBe('2026-07-13');
  });

  it('treats Sunday as the last day of the week that started Monday', () => {
    // 2026-07-19 is a Sunday.
    expect(startOfWeek('2026-07-19')).toBe('2026-07-13');
  });

  it('crosses a month boundary backwards', () => {
    // 2026-08-01 is a Saturday; its Monday is 2026-07-27.
    expect(startOfWeek('2026-08-01')).toBe('2026-07-27');
  });
});

describe('addDays', () => {
  it('adds within a month', () => {
    expect(addDays('2026-07-13', 3)).toBe('2026-07-16');
  });

  it('wraps across a month boundary', () => {
    expect(addDays('2026-07-31', 1)).toBe('2026-08-01');
  });

  it('wraps across a year boundary', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('subtracts with negative offsets', () => {
    expect(addDays('2026-08-01', -1)).toBe('2026-07-31');
  });
});

describe('weekDays', () => {
  it('returns the 7 ISO dates Monday through Sunday', () => {
    expect(weekDays('2026-07-13')).toEqual([
      '2026-07-13',
      '2026-07-14',
      '2026-07-15',
      '2026-07-16',
      '2026-07-17',
      '2026-07-18',
      '2026-07-19',
    ]);
  });
});

describe('formatWeekRange', () => {
  it('formats a range within a single month', () => {
    expect(formatWeekRange('2026-07-13')).toBe('Jul 13 – 19, 2026');
  });

  it('formats a range that crosses a month boundary', () => {
    expect(formatWeekRange('2026-07-27')).toBe('Jul 27 – Aug 2, 2026');
  });

  it('formats a range that crosses a year boundary', () => {
    expect(formatWeekRange('2026-12-28')).toBe('Dec 28, 2026 – Jan 3, 2027');
  });
});

describe('weekdayName / shortDayLabel', () => {
  it('names the weekday', () => {
    expect(weekdayName('2026-07-13')).toBe('Monday');
    expect(weekdayName('2026-07-19')).toBe('Sunday');
  });

  it('gives a short label with day of month', () => {
    expect(shortDayLabel('2026-07-13')).toBe('Mon 13');
  });
});

describe('isoToday', () => {
  it('returns a YYYY-MM-DD string', () => {
    expect(isoToday()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
