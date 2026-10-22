import { compareDates, isIsoDate } from './calendar';
import { FieldErrors, ValidationError } from './errors';

export interface AuditPlanInput {
  frameworkCode: string;
  title: string;
  scope: string[];
  targetEndDate: string;
}

const AUDIT_ID = /^AUD-(\d{4})-(\d{4})$/;

export function formatAuditId(year: number, sequence: number): string {
  return `AUD-${year}-${String(sequence).padStart(4, '0')}`;
}

export function isAuditId(value: string): boolean {
  return AUDIT_ID.test(value);
}

/** Next per-year sequence number given the ids already issued. */
export function nextAuditSequence(existingIds: readonly string[], year: number): number {
  let max = 0;
  for (const id of existingIds) {
    const m = AUDIT_ID.exec(id);
    if (m && Number(m[1]) === year) max = Math.max(max, Number(m[2]));
  }
  return max + 1;
}

/**
 * AC-02 rules. `publishedControlIds` are the published controls of the requested framework;
 * an empty scope means the whole framework.
 */
export function validateAuditPlan(
  input: Record<string, unknown>,
  publishedControlIds: readonly string[],
  today: string,
): AuditPlanInput {
  const e = new FieldErrors();
  if (publishedControlIds.length === 0) {
    throw new ValidationError({ frameworkCode: 'has no published controls to audit' });
  }
  const title = typeof input.title === 'string' ? input.title.trim() : '';
  e.check(title.length >= 3 && title.length <= 200, 'title', 'must be 3-200 characters');

  const rawScope = input.scope ?? [];
  let scope: string[] = [];
  if (!Array.isArray(rawScope) || rawScope.some((s) => typeof s !== 'string')) {
    e.add('scope', 'must be a list of control ids');
  } else {
    scope = [...new Set(rawScope as string[])];
    const unknown = scope.filter((id) => !publishedControlIds.includes(id));
    e.check(unknown.length === 0, 'scope', `not published in this framework: ${unknown.join(', ')}`);
  }

  if (!isIsoDate(input.targetEndDate)) e.add('targetEndDate', 'must be a date YYYY-MM-DD');
  else e.check(compareDates(input.targetEndDate, today) >= 0, 'targetEndDate', 'cannot be in the past');

  e.throwIfAny();
  return { frameworkCode: String(input.frameworkCode), title, scope, targetEndDate: input.targetEndDate as string };
}
