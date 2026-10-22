import { describe, expect, it } from 'vitest';
import { ACTIONS, PERMISSIONS, assertCan, can, type Action } from '../../server/src/domain/accessPolicy';
import { ROLES, type Role } from '../../server/src/domain/types';
import { ForbiddenError } from '../../server/src/domain/errors';

// Copy of the matrix in specs/admin-console_spec.md — the spec is the source of truth.
const SPEC: Record<Action, Role[]> = {
  'users.manage': ['ADMIN'],
  'controls.manage': ['ADMIN'],
  'controls.read': ['ADMIN', 'AUDITOR', 'REVIEWER'],
  'sla.manage': ['ADMIN'],
  'audits.create': ['AUDITOR'],
  'audits.transition': ['ADMIN', 'AUDITOR'],
  'audits.read': ['ADMIN', 'AUDITOR', 'REVIEWER'],
  'findings.record': ['AUDITOR'],
  'findings.readAll': ['ADMIN', 'AUDITOR', 'REVIEWER'],
  'findings.readOwn': ['OWNER'],
  'evidence.submit': ['OWNER'],
  'findings.review': ['REVIEWER'],
  'escalations.read': ['ADMIN'],
  'dashboard.global': ['ADMIN', 'AUDITOR', 'REVIEWER'],
  'dashboard.own': ['OWNER'],
};

describe('[AC-10] role permission matrix', () => {
  it('[AC-10] the code matrix lists exactly the spec actions', () => {
    expect([...ACTIONS].sort()).toEqual(Object.keys(SPEC).sort());
  });

  for (const action of Object.keys(SPEC) as Action[]) {
    for (const role of ROLES) {
      const expected = SPEC[action].includes(role);
      it(`[AC-10][NFR-04] ${role} ${expected ? 'can' : 'cannot'} ${action}`, () => {
        expect(can(role, action)).toBe(expected);
        expect(PERMISSIONS[action].includes(role)).toBe(expected);
        const call = () => assertCan({ id: 1, role, username: 'x' }, action);
        if (expected) expect(call).not.toThrow();
        else expect(call).toThrow(ForbiddenError);
      });
    }
  }
});
