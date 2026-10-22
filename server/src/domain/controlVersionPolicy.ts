import { FieldErrors, ImmutableRecordError } from './errors';
import { SEVERITIES, isSeverity, type ControlStatus, type Severity } from './types';

export interface ControlInput {
  frameworkCode: string;
  controlId: string;
  title: string;
  description: string;
  category: string;
  defaultSeverity: Severity;
}

const CONTROL_ID = /^[A-Za-z0-9][A-Za-z0-9.\-]{0,31}$/;
const FRAMEWORK_CODE = /^[A-Z0-9][A-Z0-9_\-]{1,19}$/;

function len(v: unknown, min: number, max: number): boolean {
  return typeof v === 'string' && v.trim().length >= min && v.trim().length <= max;
}

/** AC-01 field rules. Returns the input narrowed to ControlInput. */
export function validateControlInput(input: Record<string, unknown>): ControlInput {
  const e = new FieldErrors();
  e.check(typeof input.frameworkCode === 'string' && FRAMEWORK_CODE.test(input.frameworkCode), 'frameworkCode', 'must be an upper-case framework code');
  e.check(typeof input.controlId === 'string' && CONTROL_ID.test(input.controlId), 'controlId', 'must be 1-32 letters, digits, dots or dashes');
  e.check(len(input.title, 3, 200), 'title', 'must be 3-200 characters');
  e.check(len(input.description, 1, 2000), 'description', 'must be 1-2000 characters');
  e.check(len(input.category, 2, 80), 'category', 'must be 2-80 characters');
  e.check(isSeverity(input.defaultSeverity), 'defaultSeverity', `must be one of ${SEVERITIES.join(', ')}`);
  e.throwIfAny();
  return {
    frameworkCode: input.frameworkCode as string,
    controlId: input.controlId as string,
    title: (input.title as string).trim(),
    description: (input.description as string).trim(),
    category: (input.category as string).trim(),
    defaultSeverity: input.defaultSeverity as Severity,
  };
}

/** Only DRAFT versions may change; published versions are immutable (AC-01, NFR-08). */
export function assertDraftEditable(status: ControlStatus): void {
  if (status !== 'DRAFT') {
    throw new ImmutableRecordError('Published control versions are immutable; revise the control to create a new version');
  }
}

export function nextVersionNumber(existing: readonly number[]): number {
  return existing.reduce((max, v) => Math.max(max, v), 0) + 1;
}
