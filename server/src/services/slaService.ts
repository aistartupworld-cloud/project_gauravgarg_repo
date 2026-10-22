import { assertCan } from '../domain/accessPolicy';
import { FieldErrors } from '../domain/errors';
import { validateSlaDays } from '../domain/slaPolicy';
import type { Actor } from '../domain/types';
import { transaction } from '../infrastructure/db';
import type { StoredSlaRuleSet } from '../repositories/slaRepository';
import type { ServiceDeps } from './context';

export function createSlaService({ db, repos, clock, logger }: ServiceDeps) {
  return {
    active(): StoredSlaRuleSet {
      return repos.sla.active();
    },

    overview(): { active: StoredSlaRuleSet; history: StoredSlaRuleSet[] } {
      return { active: repos.sla.active(), history: repos.sla.history() };
    },

    /** Publishes the next version; existing findings keep the version they were created with (AC-05). */
    publish(actor: Actor, input: Record<string, unknown>): StoredSlaRuleSet {
      assertCan(actor, 'sla.manage');
      const raw = input.days;
      const e = new FieldErrors();
      e.check(!!raw && typeof raw === 'object' && !Array.isArray(raw), 'days', 'must be an object of severity → days');
      e.check(input.note === undefined || (typeof input.note === 'string' && input.note.length <= 500), 'note', 'must be up to 500 characters');
      e.throwIfAny();
      const days = validateSlaDays(raw as Record<string, unknown>);
      const version = transaction(db, () => {
        const next = repos.sla.active().version + 1;
        repos.sla.insert({ version: next, days, note: (input.note as string | undefined) ?? null, createdBy: actor.id, createdAt: clock.now().toISOString() });
        return next;
      });
      logger.info('sla.published', { version, ...days });
      return repos.sla.byVersion(version)!;
    },
  };
}
export type SlaService = ReturnType<typeof createSlaService>;
