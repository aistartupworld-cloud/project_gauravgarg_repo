import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SLA_DAYS,
  computeDueDate,
  overdueStatus,
  validateSlaDays,
  type SlaRuleSet,
} from '../../server/src/domain/slaPolicy';
import { ValidationError } from '../../server/src/domain/errors';

const v1: SlaRuleSet = { version: 1, days: DEFAULT_SLA_DAYS };

describe('[AC-05] severity-based due dates', () => {
  it('[AC-05] default rule set is CRITICAL 7, HIGH 30, MEDIUM 60, LOW 90', () => {
    expect(DEFAULT_SLA_DAYS).toEqual({ CRITICAL: 7, HIGH: 30, MEDIUM: 60, LOW: 90 });
  });

  it.each([
    ['CRITICAL', '2026-10-08'],
    ['HIGH', '2026-10-31'],
    ['MEDIUM', '2026-11-30'],
    ['LOW', '2026-12-30'],
  ] as const)('[AC-05] detected 2026-10-01, %s is due %s', (severity, due) => {
    expect(computeDueDate('2026-10-01', severity, v1)).toBe(due);
  });

  // Edge cases from .claude/skills/sla-evaluator/SKILL.md
  it.each([
    ['2026-02-25', 'CRITICAL', '2026-03-04', 'crosses February in a non-leap year'],
    ['2028-02-25', 'CRITICAL', '2028-03-03', 'crosses February 29 in a leap year'],
    ['2026-12-20', 'HIGH', '2027-01-19', 'crosses the year boundary'],
    ['2026-03-28', 'CRITICAL', '2026-04-04', 'ignores DST: dates are UTC calendar days'],
    ['2100-02-25', 'CRITICAL', '2100-03-04', '2100 is not a leap year'],
    ['2000-02-25', 'CRITICAL', '2000-03-03', '2000 is a leap year'],
  ] as const)('[AC-05][NFR-01] %s %s → %s (%s)', (detected, severity, due) => {
    expect(computeDueDate(detected, severity, v1)).toBe(due);
  });

  it('[AC-05] uses the days of the rule set it is given (versioned rules)', () => {
    const v2: SlaRuleSet = { version: 2, days: { CRITICAL: 3, HIGH: 14, MEDIUM: 45, LOW: 90 } };
    expect(computeDueDate('2026-10-01', 'CRITICAL', v2)).toBe('2026-10-04');
    expect(computeDueDate('2026-10-01', 'CRITICAL', v1)).toBe('2026-10-08');
  });

  it('[NFR-01] rejects malformed detection dates', () => {
    expect(() => computeDueDate('2026-02-30', 'LOW', v1)).toThrow(RangeError);
  });
});

describe('[AC-05] SLA rule set validation', () => {
  it('[AC-05] accepts whole days ordered by severity', () => {
    expect(validateSlaDays({ CRITICAL: 3, HIGH: 14, MEDIUM: 45, LOW: 90 })).toEqual({ CRITICAL: 3, HIGH: 14, MEDIUM: 45, LOW: 90 });
  });

  it.each([
    [{ CRITICAL: 2.5, HIGH: 30, MEDIUM: 60, LOW: 90 }, 'CRITICAL'],
    [{ CRITICAL: 0, HIGH: 30, MEDIUM: 60, LOW: 90 }, 'CRITICAL'],
    [{ CRITICAL: 7, HIGH: 400, MEDIUM: 60, LOW: 90 }, 'HIGH'],
    [{ CRITICAL: 7, HIGH: '30', MEDIUM: 60, LOW: 90 }, 'HIGH'],
    [{ CRITICAL: 40, HIGH: 30, MEDIUM: 60, LOW: 90 }, 'CRITICAL'],
    [{ CRITICAL: 7, HIGH: 30, MEDIUM: 60 }, 'LOW'],
  ])('[AC-05][NFR-01] rejects %j (field %s)', (input, field) => {
    try {
      validateSlaDays(input as Record<string, unknown>);
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(ValidationError);
      expect((e as ValidationError).fields).toHaveProperty(field);
    }
  });
});

describe('[AC-08] overdue detection', () => {
  it('[AC-08] one day past due is escalated with daysOverdue 1', () => {
    expect(overdueStatus('2026-10-10', 'OPEN', '2026-10-11')).toEqual({ escalated: true, daysOverdue: 1 });
  });

  it('[AC-08] the due date itself is not overdue', () => {
    expect(overdueStatus('2026-10-10', 'OPEN', '2026-10-10')).toEqual({ escalated: false, daysOverdue: 0 });
  });

  it('[AC-08] remediated findings are never escalated', () => {
    expect(overdueStatus('2026-01-01', 'REMEDIATED', '2026-10-10')).toEqual({ escalated: false, daysOverdue: 0 });
  });

  it.each(['AWAITING_REVIEW', 'RE_OPEN'] as const)('[AC-08] %s past due is still escalated', (state) => {
    expect(overdueStatus('2026-09-30', state, '2026-10-30').escalated).toBe(true);
    expect(overdueStatus('2026-09-30', state, '2026-10-30').daysOverdue).toBe(30);
  });
});
