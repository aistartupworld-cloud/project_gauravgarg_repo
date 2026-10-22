import { describe, expect, it } from 'vitest';
import {
  AUDIT_TRANSITIONS,
  assertAuditTransition,
  auditProgressPct,
  auditStage,
  canTransitionAudit,
} from '../../server/src/domain/auditStateMachine';
import { AUDIT_STATES, type AuditState } from '../../server/src/domain/types';
import { InvalidAuditStateException } from '../../server/src/domain/errors';

const ALLOWED: Array<[AuditState, AuditState]> = [
  ['PLANNED', 'IN_PROGRESS'],
  ['IN_PROGRESS', 'FINDINGS_RECORDED'],
  ['FINDINGS_RECORDED', 'REMEDIATION_IN_PROGRESS'],
  ['REMEDIATION_IN_PROGRESS', 'CLOSED'],
];
const ok = { findingCount: 1, unremediatedCount: 0 };

describe('[AC-03] audit lifecycle state machine', () => {
  it('[AC-03] transition table matches the spec exactly', () => {
    const fromTable = Object.entries(AUDIT_TRANSITIONS).flatMap(([from, tos]) => tos.map((to) => [from, to]));
    expect(fromTable.sort()).toEqual([...ALLOWED].sort());
  });

  for (const from of AUDIT_STATES) {
    for (const to of AUDIT_STATES) {
      const allowed = ALLOWED.some(([f, t]) => f === from && t === to);
      it(`[AC-03] ${from} → ${to} is ${allowed ? 'allowed' : 'rejected with InvalidAuditStateException'}`, () => {
        expect(canTransitionAudit(from, to)).toBe(allowed);
        if (allowed) expect(() => assertAuditTransition(from, to, ok)).not.toThrow();
        else expect(() => assertAuditTransition(from, to, ok)).toThrow(InvalidAuditStateException);
      });
    }
  }

  it('[AC-03] IN_PROGRESS → FINDINGS_RECORDED needs at least one finding', () => {
    expect(() => assertAuditTransition('IN_PROGRESS', 'FINDINGS_RECORDED', { findingCount: 0, unremediatedCount: 0 }))
      .toThrow(/at least one finding/);
  });

  it('[AC-03] REMEDIATION_IN_PROGRESS → CLOSED needs every finding remediated', () => {
    expect(() =>
      assertAuditTransition('REMEDIATION_IN_PROGRESS', 'CLOSED', { findingCount: 3, unremediatedCount: 1 }),
    ).toThrow(/1 finding\(s\) not remediated/);
  });

  it('[AC-03][NFR-08] CLOSED is terminal', () => {
    expect(AUDIT_TRANSITIONS.CLOSED).toEqual([]);
  });

  it('[AC-09] stage and progress are integer percentages', () => {
    expect(AUDIT_STATES.map(auditStage)).toEqual([1, 2, 3, 4, 5]);
    expect(AUDIT_STATES.map(auditProgressPct)).toEqual([0, 25, 50, 75, 100]);
  });
});
