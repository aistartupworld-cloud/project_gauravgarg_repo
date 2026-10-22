import { describe, expect, it } from 'vitest';
import {
  addDays,
  compareDates,
  daysBetween,
  fromDayNumber,
  isIsoDate,
  isoDateOf,
  toDayNumber,
} from '../../server/src/domain/calendar';

describe('[NFR-01] integer calendar arithmetic', () => {
  it('[NFR-01] day numbers are integers counted from 1970-01-01', () => {
    expect(toDayNumber('1970-01-01')).toBe(0);
    expect(toDayNumber('1970-01-02')).toBe(1);
    expect(Number.isInteger(toDayNumber('2026-10-22'))).toBe(true);
    expect(fromDayNumber(toDayNumber('2028-02-29'))).toBe('2028-02-29');
  });

  it('[NFR-01] round-trips every day of a leap year', () => {
    let d = '2028-01-01';
    for (let i = 0; i < 366; i++) {
      expect(fromDayNumber(toDayNumber(d))).toBe(d);
      d = addDays(d, 1);
    }
    expect(d).toBe('2029-01-01');
  });

  it('[NFR-01] refuses fractional days', () => {
    expect(() => addDays('2026-01-01', 1.5)).toThrow(RangeError);
    expect(() => fromDayNumber(0.25)).toThrow(RangeError);
  });

  it('[NFR-01] validates real calendar dates only', () => {
    expect(isIsoDate('2026-02-28')).toBe(true);
    expect(isIsoDate('2026-02-29')).toBe(false);
    expect(isIsoDate('2028-02-29')).toBe(true);
    expect(isIsoDate('2026-13-01')).toBe(false);
    expect(isIsoDate('2026-1-1')).toBe(false);
    expect(isIsoDate(20261001)).toBe(false);
  });

  it('[NFR-01] daysBetween and compareDates', () => {
    expect(daysBetween('2026-10-01', '2026-10-31')).toBe(30);
    expect(daysBetween('2026-10-31', '2026-10-01')).toBe(-30);
    expect(compareDates('2026-10-01', '2026-10-02')).toBe(-1);
    expect(compareDates('2026-10-02', '2026-10-02')).toBe(0);
  });

  it('[NFR-01] isoDateOf uses the UTC date', () => {
    expect(isoDateOf(new Date('2026-10-01T23:30:00-05:00'))).toBe('2026-10-02');
  });
});
