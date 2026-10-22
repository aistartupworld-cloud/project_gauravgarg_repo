/**
 * Calendar arithmetic on ISO dates (YYYY-MM-DD) using integer day numbers (NFR-01).
 * A day number is the count of whole days since 1970-01-01 (UTC). Only integers ever cross these functions;
 * Date.UTC is used solely to map whole year/month/day components to a day number and back.
 */
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const m = ISO_DATE.exec(value);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (mo < 1 || mo > 12 || d < 1) return false;
  return d <= daysInMonth(y, mo);
}

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function daysInMonth(year: number, month: number): number {
  return [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1]!;
}

export function toDayNumber(iso: string): number {
  if (!isIsoDate(iso)) throw new RangeError(`not an ISO calendar date: ${iso}`);
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number];
  // Date.UTC of whole components is an exact multiple of MS_PER_DAY, so this division is exact integer math.
  return Date.UTC(y, m - 1, d) / MS_PER_DAY;
}

export function fromDayNumber(day: number): string {
  if (!Number.isSafeInteger(day)) throw new RangeError(`day number must be an integer: ${day}`);
  const date = new Date(day * MS_PER_DAY);
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(iso: string, days: number): string {
  if (!Number.isSafeInteger(days)) throw new RangeError(`days must be a whole number: ${days}`);
  return fromDayNumber(toDayNumber(iso) + days);
}

/** Whole days from `from` to `to` (positive when `to` is later). */
export function daysBetween(from: string, to: string): number {
  return toDayNumber(to) - toDayNumber(from);
}

export function compareDates(a: string, b: string): number {
  return Math.sign(toDayNumber(a) - toDayNumber(b));
}

/** UTC calendar date of an instant. */
export function isoDateOf(instant: Date): string {
  return instant.toISOString().slice(0, 10);
}
