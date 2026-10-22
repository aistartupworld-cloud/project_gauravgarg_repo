import { assertCan } from '../domain/accessPolicy';
import { assertDraftEditable, nextVersionNumber, validateControlInput } from '../domain/controlVersionPolicy';
import { ConflictError, NotFoundError, ValidationError } from '../domain/errors';
import type { Actor, ControlVersion, Framework } from '../domain/types';
import { transaction } from '../infrastructure/db';
import type { ServiceDeps } from './context';

export function createControlService({ db, repos, clock, logger }: ServiceDeps) {
  const get = (id: number): ControlVersion => {
    const c = repos.controls.findById(id);
    if (!c) throw new NotFoundError(`Control version ${id} not found`);
    return c;
  };

  return {
    frameworks(): Framework[] {
      return repos.controls.frameworks();
    },

    /** Current (latest published) controls of a framework — what audits and findings may reference. */
    listPublished(actor: Actor, frameworkCode?: string): ControlVersion[] {
      assertCan(actor, 'controls.read');
      const codes = frameworkCode ? [frameworkCode] : repos.controls.frameworks().map((f) => f.code);
      return codes.flatMap((code) => repos.controls.latestPublished(code));
    },

    /** Every version, drafts included (admin console). */
    listAllVersions(actor: Actor, frameworkCode?: string): ControlVersion[] {
      assertCan(actor, 'controls.manage');
      return repos.controls.listAll(frameworkCode);
    },

    createDraft(actor: Actor, input: Record<string, unknown>): ControlVersion {
      assertCan(actor, 'controls.manage');
      const c = validateControlInput(input);
      if (!repos.controls.frameworkExists(c.frameworkCode)) {
        throw new ValidationError({ frameworkCode: `unknown framework ${c.frameworkCode}` });
      }
      if (repos.controls.versionsOf(c.frameworkCode, c.controlId).length > 0) {
        throw new ConflictError(`Control ${c.frameworkCode}/${c.controlId} already exists; revise it instead`);
      }
      const created = repos.controls.insert({ ...c, version: 1, createdBy: actor.id, createdAt: clock.now().toISOString() });
      logger.info('control.draft_created', { controlId: c.controlId, framework: c.frameworkCode, version: 1 });
      return created;
    },

    updateDraft(actor: Actor, id: number, patch: Record<string, unknown>): ControlVersion {
      assertCan(actor, 'controls.manage');
      const current = get(id);
      assertDraftEditable(current.status);
      const next = validateControlInput({ ...current, ...patch, frameworkCode: current.frameworkCode, controlId: current.controlId });
      repos.controls.updateDraft(id, next);
      return get(id);
    },

    publish(actor: Actor, id: number): ControlVersion {
      assertCan(actor, 'controls.manage');
      const current = get(id);
      assertDraftEditable(current.status);
      repos.controls.publishDraft(id, clock.now().toISOString());
      logger.info('control.published', { controlId: current.controlId, framework: current.frameworkCode, version: current.version });
      return get(id);
    },

    /** Creates version n+1 as a DRAFT copy of the latest version, with optional field changes. */
    revise(actor: Actor, id: number, patch: Record<string, unknown>): ControlVersion {
      assertCan(actor, 'controls.manage');
      return transaction(db, () => {
        const base = get(id);
        const versions = repos.controls.versionsOf(base.frameworkCode, base.controlId);
        if (versions.some((v) => v.status === 'DRAFT')) {
          throw new ConflictError(`Control ${base.controlId} already has an open draft`);
        }
        const latest = versions[versions.length - 1]!;
        const next = validateControlInput({ ...latest, ...patch, frameworkCode: base.frameworkCode, controlId: base.controlId });
        const version = nextVersionNumber(versions.map((v) => v.version));
        const created = repos.controls.insert({ ...next, version, createdBy: actor.id, createdAt: clock.now().toISOString() });
        logger.info('control.revised', { controlId: base.controlId, framework: base.frameworkCode, version });
        return created;
      });
    },
  };
}
export type ControlService = ReturnType<typeof createControlService>;
