import { assertCan } from '../domain/accessPolicy';
import { assertAuditOpenForChanges, assertAuditTransition } from '../domain/auditStateMachine';
import { formatAuditId, nextAuditSequence, validateAuditPlan } from '../domain/auditPolicy';
import { FieldErrors, NotFoundError, ValidationError } from '../domain/errors';
import { AUDIT_STATES, isAuditState, type Actor, type Audit, type AuditEvent, type AuditState } from '../domain/types';
import { transaction } from '../infrastructure/db';
import type { ServiceDeps } from './context';

export interface AuditDetail extends Audit {
  events: AuditEvent[];
}

/** Counts used by lifecycle guards; supplied by the findings module once it exists. */
export interface FindingCounts {
  countsForAudit(auditId: string): { findingCount: number; unremediatedCount: number };
}

const NO_FINDINGS: FindingCounts = { countsForAudit: () => ({ findingCount: 0, unremediatedCount: 0 }) };

export function createAuditService({ db, repos, clock, logger }: ServiceDeps, findings: FindingCounts = NO_FINDINGS) {
  const load = (auditId: string): Audit => {
    const a = repos.audits.findById(auditId);
    if (!a) throw new NotFoundError(`Audit ${auditId} not found`);
    return a;
  };
  const detail = (auditId: string): AuditDetail => ({ ...load(auditId), events: repos.audits.events(auditId) });

  return {
    create(actor: Actor, input: Record<string, unknown>): AuditDetail {
      assertCan(actor, 'audits.create');
      const frameworkCode = typeof input.frameworkCode === 'string' ? input.frameworkCode : '';
      if (!repos.controls.frameworkExists(frameworkCode)) throw new ValidationError({ frameworkCode: 'unknown framework' });
      const published = repos.controls.latestPublished(frameworkCode).map((c) => c.controlId);
      const plan = validateAuditPlan(input, published, clock.today());

      const auditId = transaction(db, () => {
        const year = Number(clock.today().slice(0, 4));
        const id = formatAuditId(year, nextAuditSequence(repos.audits.idsForYear(year), year));
        const at = clock.now().toISOString();
        repos.audits.insert({ ...plan, auditId: id, createdBy: actor.id, createdAt: at });
        repos.audits.appendEvent({ auditId: id, fromState: null, toState: 'PLANNED', actorId: actor.id, at });
        return id;
      });
      logger.info('audit.created', { auditId, framework: plan.frameworkCode, scopeSize: plan.scope.length });
      return detail(auditId);
    },

    get(actor: Actor, auditId: string): AuditDetail {
      assertCan(actor, 'audits.read');
      return detail(auditId);
    },

    list(actor: Actor, filter: { frameworkCode?: string } = {}): Audit[] {
      assertCan(actor, 'audits.read');
      return repos.audits.list(filter);
    },

    transition(actor: Actor, auditId: string, to: unknown, note?: unknown): AuditDetail {
      assertCan(actor, 'audits.transition');
      const e = new FieldErrors();
      e.check(isAuditState(to), 'to', `must be one of ${AUDIT_STATES.join(', ')}`);
      e.check(note === undefined || (typeof note === 'string' && note.length <= 1000), 'note', 'must be text up to 1000 characters');
      e.throwIfAny();
      transaction(db, () => {
        const audit = load(auditId);
        assertAuditOpenForChanges(audit.state, 'change its state');
        assertAuditTransition(audit.state, to as AuditState, findings.countsForAudit(auditId));
        repos.audits.appendEvent({
          auditId,
          fromState: audit.state,
          toState: to as AuditState,
          actorId: actor.id,
          note: (note as string | undefined) ?? null,
          at: clock.now().toISOString(),
        });
        logger.info('audit.transitioned', { auditId, from: audit.state, to });
      });
      return detail(auditId);
    },

    /** Used by other services: throws NotFound when missing. */
    require(auditId: string): Audit {
      return load(auditId);
    },
  };
}
export type AuditService = ReturnType<typeof createAuditService>;
