import { FieldErrors } from './errors';
import { SEVERITIES, isSeverity, type ControlVersion, type Severity, type User } from './types';

export interface FindingInput {
  controlId: string;
  severity: Severity;
  title: string;
  description: string;
  evidenceRef: string;
  ownerId: number;
}

const FINDING_ID = /^FND-(\d{5,})$/;

export function formatFindingId(sequence: number): string {
  return `FND-${String(sequence).padStart(5, '0')}`;
}

export function nextFindingSequence(lastId: string | null): number {
  const m = lastId ? FINDING_ID.exec(lastId) : null;
  return m ? Number(m[1]) + 1 : 1;
}

export interface FindingContext {
  auditFramework: string;
  /** Empty scope = whole framework. */
  auditScope: readonly string[];
  /** Latest published version of the requested control in the audit framework, if any. */
  control: ControlVersion | null;
  owner: User | null;
  raisedBy: number;
}

const text = (v: unknown, min: number, max: number) =>
  typeof v === 'string' && v.trim().length >= min && v.trim().length <= max;

/** AC-04 rules for recording a finding. Severity defaults to the control's default severity. */
export function validateFinding(input: Record<string, unknown>, ctx: FindingContext): FindingInput {
  const e = new FieldErrors();
  const controlId = typeof input.controlId === 'string' ? input.controlId : '';
  if (!ctx.control) e.add('controlId', `is not a published control of ${ctx.auditFramework}`);
  else if (ctx.auditScope.length > 0 && !ctx.auditScope.includes(controlId)) e.add('controlId', 'is outside the audit scope');

  const severity = input.severity ?? ctx.control?.defaultSeverity;
  e.check(isSeverity(severity), 'severity', `must be one of ${SEVERITIES.join(', ')}`);
  e.check(text(input.title, 3, 200), 'title', 'must be 3-200 characters');
  e.check(text(input.description, 1, 4000), 'description', 'must be 1-4000 characters');
  e.check(text(input.evidenceRef, 1, 300), 'evidenceRef', 'must be 1-300 characters');

  if (!ctx.owner || !ctx.owner.active || ctx.owner.role !== 'OWNER') e.add('ownerId', 'must be an active user with role OWNER');
  else if (ctx.owner.id === ctx.raisedBy) e.add('ownerId', 'cannot be the auditor who raised the finding');
  e.throwIfAny();

  return {
    controlId,
    severity: severity as Severity,
    title: (input.title as string).trim(),
    description: (input.description as string).trim(),
    evidenceRef: (input.evidenceRef as string).trim(),
    ownerId: ctx.owner!.id,
  };
}
