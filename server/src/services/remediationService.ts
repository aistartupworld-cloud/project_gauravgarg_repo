import { assertCan } from '../domain/accessPolicy';
import { formatEvidenceId, evidenceStorageRef, validateEvidence, validateReview } from '../domain/evidencePolicy';
import { assertFindingTransition } from '../domain/findingStateMachine';
import { type Actor } from '../domain/types';
import { transaction } from '../infrastructure/db';
import type { ServiceDeps } from './context';
import type { FindingDetail, FindingService } from './findingService';

/** Evidence submission and review decisions (AC-06, AC-07). */
export function createRemediationService({ db, repos, clock, logger }: ServiceDeps, findings: FindingService) {
  return {
    submitEvidence(actor: Actor, findingId: string, input: Record<string, unknown>): FindingDetail {
      assertCan(actor, 'evidence.submit');
      const meta = validateEvidence(input);
      transaction(db, () => {
        const finding = findings.visible(actor, findingId);
        assertFindingTransition(finding.state, 'AWAITING_REVIEW');
        const evidenceId = formatEvidenceId(repos.evidence.count() + 1);
        const at = clock.now().toISOString();
        repos.evidence.insert({
          ...meta,
          evidenceId,
          findingId,
          storageRef: evidenceStorageRef(findingId, evidenceId),
          uploadedById: actor.id,
          uploadedAt: at,
        });
        repos.findings.appendEvent({ findingId, fromState: finding.state, toState: 'AWAITING_REVIEW', actorId: actor.id, comment: meta.note, at });
        logger.info('finding.evidence_submitted', { auditId: finding.auditId, findingId, evidenceId, sizeBytes: meta.sizeBytes });
      });
      return findings.get(actor, findingId);
    },

    review(actor: Actor, findingId: string, input: Record<string, unknown>): FindingDetail {
      assertCan(actor, 'findings.review');
      const { decision, comment } = validateReview(input);
      transaction(db, () => {
        const finding = findings.visible(actor, findingId);
        assertFindingTransition(finding.state, decision);
        repos.findings.appendEvent({ findingId, fromState: finding.state, toState: decision, actorId: actor.id, comment, at: clock.now().toISOString() });
        logger.info('finding.reviewed', { auditId: finding.auditId, findingId, decision });
      });
      return findings.get(actor, findingId);
    },

    queue(actor: Actor): FindingDetail[] {
      assertCan(actor, 'findings.review');
      return findings.list(actor, { state: 'AWAITING_REVIEW' }).map((f) => findings.detail(f));
    },
  };
}
export type RemediationService = ReturnType<typeof createRemediationService>;
