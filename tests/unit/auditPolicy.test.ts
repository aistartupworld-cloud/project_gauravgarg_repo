import { describe, expect, it } from 'vitest';
import { formatAuditId, nextAuditSequence, validateAuditPlan } from '../../server/src/domain/auditPolicy';
import { ValidationError } from '../../server/src/domain/errors';

const published = ['CC6.1', 'CC6.2', 'CC7.2'];
const base = { frameworkCode: 'SOC2', title: 'Q4 SOC 2 readiness', scope: ['CC6.1'], targetEndDate: '2026-12-15' };

describe('[AC-02] audit plan rules', () => {
  it('[AC-02] formats ids as AUD-YYYY-NNNN', () => {
    expect(formatAuditId(2026, 1)).toBe('AUD-2026-0001');
    expect(formatAuditId(2026, 1234)).toBe('AUD-2026-1234');
  });

  it('[AC-02] sequence continues from the highest id of the same year', () => {
    expect(nextAuditSequence([], 2026)).toBe(1);
    expect(nextAuditSequence(['AUD-2026-0001', 'AUD-2026-0007', 'AUD-2025-0099'], 2026)).toBe(8);
  });

  it('[AC-02] accepts a valid plan and de-duplicates scope', () => {
    const plan = validateAuditPlan({ ...base, scope: ['CC6.1', 'CC6.1', 'CC7.2'] }, published, '2026-10-01');
    expect(plan.scope).toEqual(['CC6.1', 'CC7.2']);
  });

  it('[AC-02] empty scope means the whole framework', () => {
    expect(validateAuditPlan({ ...base, scope: [] }, published, '2026-10-01').scope).toEqual([]);
  });

  it.each([
    [{ scope: ['NOPE'] }, 'scope'],
    [{ targetEndDate: '2026-09-30' }, 'targetEndDate'],
    [{ targetEndDate: '15/12/2026' }, 'targetEndDate'],
    [{ title: 'x' }, 'title'],
  ])('[AC-02] rejects %j', (patch, field) => {
    try {
      validateAuditPlan({ ...base, ...patch }, published, '2026-10-01');
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(ValidationError);
      expect((e as ValidationError).fields).toHaveProperty(field);
    }
  });

  it('[AC-02] a framework with no published controls cannot be audited', () => {
    expect(() => validateAuditPlan(base, [], '2026-10-01')).toThrow(ValidationError);
  });
});
