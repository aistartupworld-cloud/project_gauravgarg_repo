import { assertCan, can } from '../domain/accessPolicy';
import { assertAuditAcceptsFindings } from '../domain/auditStateMachine';
import { FieldErrors, NotFoundError } from '../domain/errors';
import { formatFindingId, nextFindingSequence, validateFinding } from '../domain/findingPolicy';
import { compareEscalations, computeDueDate, overdueStatus } from '../domain/slaPolicy';
import {
  FINDING_STATES,
  SEVERITIES,
  isFindingState,
  isSeverity,
  type Actor,
  type FindingEvent,
  type FindingRecord,
  type FindingView,
} from '../domain/types';
import { transaction } from '../infrastructure/db';
import type { FindingFilter } from '../repositories/findingRepository';
import type { ServiceDeps } from './context';

export interface FindingDetail extends FindingView {
  events: FindingEvent[];
}

export function createFindingService({ db, repos, clock, logger }: ServiceDeps) {
  const view = (f: FindingRecord): FindingView => ({ ...f, ...overdueStatus(f.dueDate, f.state, clock.today()) });

  const detail = (f: FindingRecord): FindingDetail => ({ ...view(f), events: repos.findings.events(f.findingId) });

  /** Loads a finding the actor may see. Owners get 404 for findings that are not theirs (NFR-04). */
  const visible = (actor: Actor, findingId: string): FindingRecord => {
    const f = repos.findings.findById(findingId);
    const allowed = f && (can(actor.role, 'findings.readAll') || (can(actor.role, 'findings.readOwn') && f.ownerId === actor.id));
    if (!f || !allowed) throw new NotFoundError(`Finding ${findingId} not found`);
    return f;
  };

  return {
    record(actor: Actor, auditId: string, input: Record<string, unknown>): FindingDetail {
      assertCan(actor, 'findings.record');
      const findingId = transaction(db, () => {
        const audit = repos.audits.findById(auditId);
        if (!audit) throw new NotFoundError(`Audit ${auditId} not found`);
        assertAuditAcceptsFindings(audit.state);

        const controlId = typeof input.controlId === 'string' ? input.controlId : '';
        const ownerId = typeof input.ownerId === 'number' ? input.ownerId : Number.NaN;
        const valid = validateFinding(input, {
          auditFramework: audit.frameworkCode,
          auditScope: audit.scope,
          control: repos.controls.latestPublishedOne(audit.frameworkCode, controlId),
          owner: Number.isInteger(ownerId) ? repos.users.findById(ownerId) : null,
          raisedBy: actor.id,
        });
        const control = repos.controls.latestPublishedOne(audit.frameworkCode, valid.controlId)!;
        const sla = repos.sla.active();
        const detectedOn = clock.today();
        const id = formatFindingId(nextFindingSequence(repos.findings.lastFindingId()));
        const at = clock.now().toISOString();
        repos.findings.insert({
          ...valid,
          findingId: id,
          auditId,
          frameworkCode: audit.frameworkCode,
          controlVersion: control.version,
          raisedBy: actor.id,
          detectedOn,
          dueDate: computeDueDate(detectedOn, valid.severity, sla),
          slaRuleSetVersion: sla.version,
          createdAt: at,
        });
        repos.findings.appendEvent({ findingId: id, fromState: null, toState: 'OPEN', actorId: actor.id, at });
        return id;
      });
      const created = repos.findings.findById(findingId)!;
      logger.info('finding.recorded', { auditId, findingId, severity: created.severity, dueDate: created.dueDate });
      return detail(created);
    },

    get(actor: Actor, findingId: string): FindingDetail {
      return detail(visible(actor, findingId));
    },

    list(actor: Actor, query: Record<string, unknown> = {}): FindingView[] {
      const e = new FieldErrors();
      e.check(query.state === undefined || isFindingState(query.state), 'state', `must be one of ${FINDING_STATES.join(', ')}`);
      e.check(query.severity === undefined || isSeverity(query.severity), 'severity', `must be one of ${SEVERITIES.join(', ')}`);
      e.throwIfAny();
      const filter: FindingFilter = {
        auditId: typeof query.auditId === 'string' ? query.auditId : undefined,
        state: query.state as FindingFilter['state'],
        severity: query.severity as FindingFilter['severity'],
      };
      if (!can(actor.role, 'findings.readAll')) {
        assertCan(actor, 'findings.readOwn');
        filter.ownerId = actor.id;
      }
      return repos.findings.list(filter).map(view);
    },

    /** Admin escalation queue (AC-08). */
    escalations(actor: Actor): FindingView[] {
      assertCan(actor, 'escalations.read');
      return repos.findings.list().map(view).filter((f) => f.escalated).sort(compareEscalations);
    },

    /** Guard data for the audit lifecycle (AC-03). */
    countsForAudit(auditId: string): { findingCount: number; unremediatedCount: number } {
      const all = repos.findings.list({ auditId });
      return { findingCount: all.length, unremediatedCount: all.filter((f) => f.state !== 'REMEDIATED').length };
    },

    /** For sibling services: the raw record or 404 by visibility rules. */
    visible,
  };
}
export type FindingService = ReturnType<typeof createFindingService>;
