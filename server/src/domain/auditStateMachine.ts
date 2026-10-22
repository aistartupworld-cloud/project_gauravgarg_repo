import { InvalidAuditStateException } from './errors';
import { AUDIT_STATES, type AuditState } from './types';

/** Allowed audit transitions — must equal the table in specs/audit-plan_spec.md (AC-03). */
export const AUDIT_TRANSITIONS: Readonly<Record<AuditState, readonly AuditState[]>> = Object.freeze({
  PLANNED: ['IN_PROGRESS'],
  IN_PROGRESS: ['FINDINGS_RECORDED'],
  FINDINGS_RECORDED: ['REMEDIATION_IN_PROGRESS'],
  REMEDIATION_IN_PROGRESS: ['CLOSED'],
  CLOSED: [],
});

export interface AuditGuardContext {
  /** Findings recorded against the audit. */
  findingCount: number;
  /** Findings not yet REMEDIATED. */
  unremediatedCount: number;
}

export function canTransitionAudit(from: AuditState, to: AuditState): boolean {
  return AUDIT_TRANSITIONS[from].includes(to);
}

/** Throws InvalidAuditStateException unless `from → to` is in the table and its guard holds. */
export function assertAuditTransition(from: AuditState, to: AuditState, ctx: AuditGuardContext): void {
  if (!canTransitionAudit(from, to)) {
    const allowed = AUDIT_TRANSITIONS[from];
    throw new InvalidAuditStateException(
      `Audit cannot move from ${from} to ${to}` +
        (allowed.length ? `; allowed next state: ${allowed.join(', ')}` : '; the audit is closed'),
    );
  }
  if (to === 'FINDINGS_RECORDED' && ctx.findingCount === 0) {
    throw new InvalidAuditStateException('Record at least one finding before moving to FINDINGS_RECORDED');
  }
  if (to === 'CLOSED' && ctx.unremediatedCount > 0) {
    throw new InvalidAuditStateException(
      `Audit cannot close: ${ctx.unremediatedCount} finding(s) not remediated`,
    );
  }
}

/** Closed audits are read-only (NFR-08). */
export function assertAuditOpenForChanges(state: AuditState, what: string): void {
  if (state === 'CLOSED') throw new InvalidAuditStateException(`Audit is CLOSED; cannot ${what}`);
}

/** Findings may be recorded only while fieldwork is open. */
export function assertAuditAcceptsFindings(state: AuditState): void {
  assertAuditOpenForChanges(state, 'record findings');
  if (state !== 'IN_PROGRESS' && state !== 'FINDINGS_RECORDED') {
    throw new InvalidAuditStateException(`Findings can be recorded only while the audit is IN_PROGRESS or FINDINGS_RECORDED (now ${state})`);
  }
}

/** 1-based position of a state in the lifecycle. */
export function auditStage(state: AuditState): number {
  return AUDIT_STATES.indexOf(state) + 1;
}

/** Integer percentage of lifecycle completed (AC-09): PLANNED 0 … CLOSED 100. */
export function auditProgressPct(state: AuditState): number {
  return Math.floor(((auditStage(state) - 1) * 100) / (AUDIT_STATES.length - 1));
}
