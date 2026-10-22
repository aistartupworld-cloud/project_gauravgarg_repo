import { createApp, type AppContext } from '../app';
import { addDays } from '../domain/calendar';
import type { Actor } from '../domain/types';
import { fixedClock } from '../infrastructure/clock';
import { SEED_CONTROLS, SEED_USERS } from './data';

function actor(ctx: AppContext, username: string): Actor {
  const u = ctx.repos.users.findByUsername(username)!;
  return { id: u.id, role: u.role, username: u.username };
}

/**
 * Seeds synthetic users, a published controls library, sample audits and findings on an empty database.
 * History is replayed through the real services with a back-dated clock, so every row passes the same rules
 * (and the same append-only path) as live traffic.
 */
export function seedIfEmpty(ctx: AppContext): Record<string, number> | null {
  if (ctx.repos.users.count() > 0) return null;
  const today = ctx.clock.today();
  const at = (offsetDays: number) => {
    const clock = fixedClock(`${addDays(today, offsetDays)}T09:00:00.000Z`);
    return createApp({ db: ctx.db, clock, logger: ctx.logger, tokenSecret: 'seed-only', webDist: null }).services;
  };

  const start = at(-45);
  for (const u of SEED_USERS) ctx.repos.users.insert({ ...u, createdAt: `${addDays(today, -45)}T09:00:00.000Z` });
  const admin = actor(ctx, 'alice.admin');
  const ravi = actor(ctx, 'ravi.auditor');
  const arun = actor(ctx, 'arun.auditor');
  const olivia = actor(ctx, 'olivia.owner');
  const omar = actor(ctx, 'omar.owner');

  let controls = 0;
  for (const [frameworkCode, list] of Object.entries(SEED_CONTROLS)) {
    for (const c of list) {
      const draft = start.controls.createDraft(admin, {
        frameworkCode,
        controlId: c.controlId,
        title: c.title,
        description: c.description,
        category: c.category,
        defaultSeverity: c.severity,
      });
      start.controls.publish(admin, draft.id);
      controls++;
    }
  }

  // SOC 2 audit: fieldwork 40 days ago, two findings now overdue.
  const d40 = at(-40);
  const soc2 = d40.audits.create(ravi, {
    frameworkCode: 'SOC2',
    title: 'SOC 2 Type II readiness — payments platform',
    scope: ['CC6.1', 'CC6.2', 'CC6.6', 'CC7.2'],
    targetEndDate: addDays(today, 30),
  });
  d40.audits.transition(ravi, soc2.auditId, 'IN_PROGRESS');
  const findings = [
    d40.findings.record(ravi, soc2.auditId, {
      controlId: 'CC6.6',
      title: 'Admin portal reachable from the internet without VPN',
      description: 'The admin console on admin-portal.example.internal (10.20.4.17) accepts logins from any source address.',
      evidenceRef: 'WP-SOC2-014 port scan export',
      ownerId: olivia.id,
    }),
    d40.findings.record(ravi, soc2.auditId, {
      controlId: 'CC6.1',
      title: 'Shared service account used by three teams',
      description: 'svc-payments-batch is used interactively by three teams; no individual accountability.',
      evidenceRef: 'WP-SOC2-009 access review sheet',
      ownerId: omar.id,
    }),
    d40.findings.record(ravi, soc2.auditId, {
      controlId: 'CC7.2',
      severity: 'MEDIUM',
      title: 'Alert routing gaps for ASSET-2231 database cluster',
      description: 'Database audit alerts for ASSET-2231 are not routed to the on-call rotation.',
      evidenceRef: 'WP-SOC2-021 SIEM rule list',
      ownerId: olivia.id,
    }),
  ];
  d40.audits.transition(ravi, soc2.auditId, 'FINDINGS_RECORDED');
  at(-38).audits.transition(ravi, soc2.auditId, 'REMEDIATION_IN_PROGRESS');

  // ISO 27001 audit: fieldwork this week.
  const d5 = at(-5);
  const iso = d5.audits.create(arun, {
    frameworkCode: 'ISO27001',
    title: 'ISO 27001 surveillance audit — Annex A technological controls',
    scope: ['A.8.2', 'A.8.8', 'A.8.13', 'A.8.15', 'A.8.24'],
    targetEndDate: addDays(today, 60),
  });
  d5.audits.transition(arun, iso.auditId, 'IN_PROGRESS');
  findings.push(
    at(-2).findings.record(arun, iso.auditId, {
      controlId: 'A.8.8',
      title: 'Critical OS patches 45 days behind on build agents',
      description: 'Build agents ci-runner-0[1-4].example.internal miss two critical kernel updates.',
      evidenceRef: 'WP-ISO-003 patch report',
      ownerId: omar.id,
    }),
    at(-1).findings.record(arun, iso.auditId, {
      controlId: 'A.8.13',
      title: 'Backup restore test not performed this quarter',
      description: 'No evidence of a restore test for the document store in the last 90 days.',
      evidenceRef: 'WP-ISO-005 backup log extract',
      ownerId: olivia.id,
    }),
  );

  // CIS audit: planned only.
  at(0).audits.create(ravi, {
    frameworkCode: 'CIS',
    title: 'CIS v8 baseline — workstation fleet',
    scope: [],
    targetEndDate: addDays(today, 120),
  });

  return { users: SEED_USERS.length, controls, audits: 3, findings: findings.length };
}
