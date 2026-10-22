import { beforeEach, describe, expect, it } from 'vitest';
import { bearer, makeFixture, type Fixture } from '../helpers/fixture';

let f: Fixture;
let auditId: string;

beforeEach(async () => {
  f = makeFixture({ today: '2026-10-01' });
  f.publishControls('SOC2', [{ controlId: 'CC6.1', severity: 'HIGH' }, { controlId: 'CC6.6', severity: 'CRITICAL' }]);
  const auditor = bearer(await f.token('ravi.auditor'));
  const a = await f.api.post('/api/audits').set(auditor).send({ frameworkCode: 'SOC2', title: 'SLA audit', scope: [], targetEndDate: '2026-12-31' });
  auditId = a.body.auditId;
  await f.api.post(`/api/audits/${auditId}/transition`).set(auditor).send({ to: 'IN_PROGRESS' });
});

async function record(controlId: string, owner = 'olivia.owner') {
  const res = await f.api
    .post(`/api/audits/${auditId}/findings`)
    .set(bearer(await f.token('ravi.auditor')))
    .send({ controlId, title: `Gap in ${controlId}`, description: 'Synthetic gap', evidenceRef: 'WP-7', ownerId: f.actor(owner).id });
  expect(res.status).toBe(201);
  return res.body as { findingId: string; dueDate: string; slaRuleSetVersion: number };
}

describe('[AC-05] versioned SLA rules', () => {
  it('[AC-05] v1 is active by default', async () => {
    const res = await f.api.get('/api/sla-rules').set(bearer(await f.token('olivia.owner')));
    expect(res.body.active).toMatchObject({ version: 1, days: { CRITICAL: 7, HIGH: 30, MEDIUM: 60, LOW: 90 } });
  });

  it('[AC-05] a new version applies to new findings only', async () => {
    const before = await record('CC6.6');
    expect(before).toMatchObject({ dueDate: '2026-10-08', slaRuleSetVersion: 1 });

    const admin = bearer(await f.token('alice.admin'));
    const v2 = await f.api.post('/api/admin/sla-rules').set(admin).send({ days: { CRITICAL: 3, HIGH: 14, MEDIUM: 45, LOW: 90 }, note: 'Tighter after incident review' });
    expect(v2.status).toBe(201);
    expect(v2.body.version).toBe(2);

    const after = await record('CC6.6');
    expect(after).toMatchObject({ dueDate: '2026-10-04', slaRuleSetVersion: 2 });

    const old = await f.api.get(`/api/findings/${before.findingId}`).set(admin);
    expect(old.body).toMatchObject({ dueDate: '2026-10-08', slaRuleSetVersion: 1 });

    const history = await f.api.get('/api/sla-rules').set(admin);
    expect(history.body.history.map((r: { version: number }) => r.version)).toEqual([2, 1]);
  });

  it('[AC-05][NFR-01] rejects fractional or mis-ordered days; only admins may publish', async () => {
    const admin = bearer(await f.token('alice.admin'));
    expect((await f.api.post('/api/admin/sla-rules').set(admin).send({ days: { CRITICAL: 2.5, HIGH: 30, MEDIUM: 60, LOW: 90 } })).status).toBe(400);
    expect((await f.api.post('/api/admin/sla-rules').set(admin).send({ days: { CRITICAL: 31, HIGH: 30, MEDIUM: 60, LOW: 90 } })).status).toBe(400);
    const auditor = bearer(await f.token('ravi.auditor'));
    expect((await f.api.post('/api/admin/sla-rules').set(auditor).send({ days: { CRITICAL: 1, HIGH: 2, MEDIUM: 3, LOW: 4 } })).status).toBe(403);
  });

  it('[AC-05][NFR-02] rule sets are append-only in the database', () => {
    expect(() => f.ctx.db.exec('UPDATE sla_rule_sets SET critical_days = 1')).toThrow(/append-only/);
    expect(() => f.ctx.db.exec('DELETE FROM sla_rule_sets')).toThrow(/append-only/);
  });
});

describe('[AC-08] escalation', () => {
  it('[AC-08] overdue findings are flagged and queued for admins, most overdue first', async () => {
    const critical = await record('CC6.6'); // due 2026-10-08
    const high = await record('CC6.1', 'omar.owner'); // due 2026-10-31
    f.clock.set('2026-10-20T08:00:00.000Z');
    const admin = bearer(await f.token('alice.admin'));

    const q = await f.api.get('/api/admin/escalations').set(admin);
    expect(q.status).toBe(200);
    expect(q.body).toEqual([expect.objectContaining({ findingId: critical.findingId, escalated: true, daysOverdue: 12, owner: 'olivia.owner' })]);

    f.clock.set('2026-11-10T08:00:00.000Z');
    const q2 = await f.api.get('/api/admin/escalations').set(bearer(await f.token('alice.admin')));
    expect(q2.body.map((x: { findingId: string; daysOverdue: number }) => [x.findingId, x.daysOverdue])).toEqual([
      [critical.findingId, 33],
      [high.findingId, 10],
    ]);

    const view = await f.api.get(`/api/findings/${high.findingId}`).set(bearer(await f.token('omar.owner')));
    expect(view.body).toMatchObject({ escalated: true, daysOverdue: 10 });
  });

  it('[AC-08] a finding on its due date is not escalated', async () => {
    const c = await record('CC6.6');
    f.clock.set('2026-10-08T23:59:00.000Z');
    const res = await f.api.get(`/api/findings/${c.findingId}`).set(bearer(await f.token('alice.admin')));
    expect(res.body).toMatchObject({ escalated: false, daysOverdue: 0 });
    expect((await f.api.get('/api/admin/escalations').set(bearer(await f.token('alice.admin')))).body).toEqual([]);
  });

  it('[AC-08][AC-10] only admins see the escalation queue', async () => {
    for (const u of ['ravi.auditor', 'olivia.owner', 'rhea.reviewer']) {
      expect((await f.api.get('/api/admin/escalations').set(bearer(await f.token(u)))).status, u).toBe(403);
    }
  });
});
