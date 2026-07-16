import { describe, expect, it } from 'vitest';
import {
  durationLabel,
  minutesToInputValue,
  minutesToLabel,
  parseTimeInput,
} from './time';

describe('minutesToLabel', () => {
  it('formats a morning time in 12-hour clock', () => {
    expect(minutesToLabel(540)).toBe('9:00 AM');
  });

  it('formats midnight as 12:00 AM', () => {
    expect(minutesToLabel(0)).toBe('12:00 AM');
  });

  it('formats noon as 12:00 PM', () => {
    expect(minutesToLabel(720)).toBe('12:00 PM');
  });

  it('formats the last minute of the day', () => {
    expect(minutesToLabel(1439)).toBe('11:59 PM');
  });

  it('pads minutes with a leading zero', () => {
    expect(minutesToLabel(545)).toBe('9:05 AM');
  });

  it('throws on out-of-range minutes', () => {
    expect(() => minutesToLabel(-1)).toThrow();
    expect(() => minutesToLabel(1440)).toThrow();
  });
});

describe('parseTimeInput', () => {
  it('parses a 24-hour HH:MM value into minutes from midnight', () => {
    expect(parseTimeInput('09:00')).toBe(540);
    expect(parseTimeInput('00:00')).toBe(0);
    expect(parseTimeInput('23:59')).toBe(1439);
  });

  it('rejects malformed input', () => {
    expect(() => parseTimeInput('9am')).toThrow();
    expect(() => parseTimeInput('24:00')).toThrow();
    expect(() => parseTimeInput('12:60')).toThrow();
    expect(() => parseTimeInput('')).toThrow();
  });
});

describe('minutesToInputValue', () => {
  it('formats minutes as a zero-padded 24-hour value', () => {
    expect(minutesToInputValue(540)).toBe('09:00');
    expect(minutesToInputValue(0)).toBe('00:00');
    expect(minutesToInputValue(1439)).toBe('23:59');
  });

  it('round-trips with parseTimeInput', () => {
    for (const m of [0, 1, 540, 725, 1439]) {
      expect(parseTimeInput(minutesToInputValue(m))).toBe(m);
    }
  });
});

describe('durationLabel', () => {
  it('labels whole-hour durations', () => {
    expect(durationLabel(540, 720)).toBe('3h');
  });

  it('labels sub-hour durations', () => {
    expect(durationLabel(540, 585)).toBe('45m');
  });

  it('labels mixed hour-and-minute durations', () => {
    expect(durationLabel(540, 630)).toBe('1h 30m');
  });
});
