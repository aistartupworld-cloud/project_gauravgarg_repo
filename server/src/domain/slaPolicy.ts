import { addDays, daysBetween } from './calendar';
import { FieldErrors } from './errors';
import { SEVERITIES, SEVERITY_RANK, type FindingState, type Severity } from './types';

export type SlaDays = Record<Severity, number>;

export interface SlaRuleSet {
  version: number;
  days: SlaDays;
}

export const DEFAULT_SLA_DAYS: SlaDays = { CRITICAL: 7, HIGH: 30, MEDIUM: 60, LOW: 90 };
export const MAX_SLA_DAYS = 365;

/** AC-05: due = detection date + whole days for the severity, on UTC calendar dates (NFR-01). */
export function computeDueDate(detectedOn: string, severity: Severity, ruleSet: SlaRuleSet): string {
  return addDays(detectedOn, ruleSet.days[severity]);
}

/** Whole days 1-365 per severity; more severe never gets longer than less severe. */
export function validateSlaDays(input: Record<string, unknown>): SlaDays {
  const e = new FieldErrors();
  for (const s of SEVERITIES) {
    const v = input[s];
    e.check(typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= MAX_SLA_DAYS, s, `must be a whole number of days from 1 to ${MAX_SLA_DAYS}`);
  }
  e.throwIfAny();
  const days = Object.fromEntries(SEVERITIES.map((s) => [s, input[s] as number])) as SlaDays;
  for (let i = 0; i < SEVERITIES.length - 1; i++) {
    const more = SEVERITIES[i]!;
    const less = SEVERITIES[i + 1]!;
    e.check(days[more] <= days[less], more, `cannot be longer than ${less} (${days[less]} days)`);
  }
  e.throwIfAny();
  return days;
}

export interface OverdueStatus {
  escalated: boolean;
  daysOverdue: number;
}

/** AC-08: overdue ⇔ today > due date and the finding is not REMEDIATED. */
export function overdueStatus(dueDate: string, state: FindingState, today: string): OverdueStatus {
  if (state === 'REMEDIATED') return { escalated: false, daysOverdue: 0 };
  const late = daysBetween(dueDate, today);
  return late > 0 ? { escalated: true, daysOverdue: late } : { escalated: false, daysOverdue: 0 };
}

/** Escalation queue order: most days overdue first, then most severe, then id. */
export function compareEscalations(
  a: { daysOverdue: number; severity: Severity; findingId: string },
  b: { daysOverdue: number; severity: Severity; findingId: string },
): number {
  return b.daysOverdue - a.daysOverdue || SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] || a.findingId.localeCompare(b.findingId);
}
