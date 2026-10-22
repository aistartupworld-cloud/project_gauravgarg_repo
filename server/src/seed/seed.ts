import type { AppContext } from '../app';
import { addDays } from '../domain/calendar';
import type { Actor } from '../domain/types';
import { SEED_CONTROLS, SEED_USERS } from './data';

function actor(ctx: AppContext, username: string): Actor {
  const u = ctx.repos.users.findByUsername(username)!;
  return { id: u.id, role: u.role, username: u.username };
}

/** Seeds synthetic users, a published controls library and sample audits on an empty database. */
export function seedIfEmpty(ctx: AppContext): Record<string, number> | null {
  if (ctx.repos.users.count() > 0) return null;
  const at = ctx.clock.now().toISOString();
  for (const u of SEED_USERS) ctx.repos.users.insert({ ...u, createdAt: at });

  const admin = actor(ctx, 'alice.admin');
  let controls = 0;
  for (const [frameworkCode, list] of Object.entries(SEED_CONTROLS)) {
    for (const c of list) {
      const draft = ctx.services.controls.createDraft(admin, {
        frameworkCode,
        controlId: c.controlId,
        title: c.title,
        description: c.description,
        category: c.category,
        defaultSeverity: c.severity,
      });
      ctx.services.controls.publish(admin, draft.id);
      controls++;
    }
  }

  const auditor = actor(ctx, 'ravi.auditor');
  const today = ctx.clock.today();
  const plusDays = (n: number) => addDays(today, n);
  const soc2 = ctx.services.audits.create(auditor, {
    frameworkCode: 'SOC2',
    title: 'SOC 2 Type II readiness — payments platform',
    scope: ['CC6.1', 'CC6.2', 'CC6.6', 'CC7.2'],
    targetEndDate: plusDays(60),
  });
  ctx.services.audits.transition(auditor, soc2.auditId, 'IN_PROGRESS');
  ctx.services.audits.create(auditor, {
    frameworkCode: 'ISO27001',
    title: 'ISO 27001 surveillance audit — Annex A technological controls',
    scope: ['A.8.2', 'A.8.8', 'A.8.13', 'A.8.15', 'A.8.24'],
    targetEndDate: plusDays(90),
  });

  return { users: SEED_USERS.length, controls, audits: 2 };
}
