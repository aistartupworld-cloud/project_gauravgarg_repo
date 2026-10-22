import { isoDateOf } from '../domain/calendar';

/** Time source. Inject it; never call `new Date()` in services or domain. */
export interface Clock {
  now(): Date;
  /** UTC calendar date, YYYY-MM-DD. */
  today(): string;
}

export interface MutableClock extends Clock {
  set(iso: string): void;
  advanceDays(days: number): void;
}

export const systemClock: Clock = {
  now: () => new Date(),
  today: () => isoDateOf(new Date()),
};

/** Deterministic clock for tests and demos. */
export function fixedClock(iso: string): MutableClock {
  let current = new Date(iso);
  if (Number.isNaN(current.getTime())) throw new RangeError(`invalid instant: ${iso}`);
  return {
    now: () => new Date(current.getTime()),
    today: () => isoDateOf(current),
    set(next: string) {
      current = new Date(next);
    },
    advanceDays(days: number) {
      if (!Number.isSafeInteger(days)) throw new RangeError('days must be an integer');
      current = new Date(current.getTime() + days * 86_400_000);
    },
  };
}
