import { SeparationOfDutiesViolation } from './errors';
import type { Role } from './types';

export interface SodContext {
  /** The person making the review decision. */
  deciderId: number;
  deciderRole: Role;
  ownerId: number;
  raisedById: number;
  /** Everyone who uploaded evidence for the finding. */
  evidenceUploaderIds: readonly number[];
}

/**
 * NFR-08: nobody attests to their own work. Compares user ids, never current roles, so a person whose
 * role changed (owner → reviewer, auditor → reviewer) is still blocked on findings they were involved in.
 */
export function assertSeparationOfDuties(ctx: SodContext): void {
  if (ctx.deciderRole !== 'REVIEWER') {
    throw new SeparationOfDutiesViolation('Only an independent REVIEWER can decide a remediation');
  }
  if (ctx.deciderId === ctx.ownerId) {
    throw new SeparationOfDutiesViolation('The finding owner cannot review their own remediation');
  }
  if (ctx.deciderId === ctx.raisedById) {
    throw new SeparationOfDutiesViolation('The auditor who raised the finding cannot review its remediation');
  }
  if (ctx.evidenceUploaderIds.includes(ctx.deciderId)) {
    throw new SeparationOfDutiesViolation('A user who submitted evidence cannot review it');
  }
}
