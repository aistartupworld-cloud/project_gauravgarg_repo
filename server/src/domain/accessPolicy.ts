import { ForbiddenError } from './errors';
import type { Actor, Role } from './types';

export type Action =
  | 'users.manage'
  | 'controls.manage'
  | 'controls.read'
  | 'sla.manage'
  | 'audits.create'
  | 'audits.transition'
  | 'audits.read'
  | 'findings.record'
  | 'findings.readAll'
  | 'findings.readOwn'
  | 'evidence.submit'
  | 'findings.review'
  | 'escalations.read'
  | 'dashboard.global'
  | 'dashboard.own';

/** Permission matrix — mirrors specs/admin-console_spec.md (AC-10). */
export const PERMISSIONS: Readonly<Record<Action, readonly Role[]>> = Object.freeze({
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
});

export const ACTIONS = Object.keys(PERMISSIONS) as Action[];

export function can(role: Role, action: Action): boolean {
  return PERMISSIONS[action].includes(role);
}

export function assertCan(actor: Actor, action: Action): void {
  if (!can(actor.role, action)) {
    throw new ForbiddenError(`Role ${actor.role} is not allowed to ${action}`);
  }
}

/** Roles allowed to perform any of the given actions (used to declare routes). */
export function rolesFor(...actions: Action[]): Role[] {
  return [...new Set(actions.flatMap((a) => PERMISSIONS[a]))];
}
