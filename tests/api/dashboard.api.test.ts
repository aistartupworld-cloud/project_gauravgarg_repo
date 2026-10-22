import { describe, expect, it } from 'vitest';
import { bearer, makeFixture } from '../helpers/fixture';

describe('[AC-09] dashboard API', () => {
  async function setup() {
    const f = makeFixture({ today: '2026-10-01' });
    f.publishControls('SOC2', [{ controlId: 'CC6.1' }, { controlId: 'CC6.2' }, { controlId: 'CC7.2' }, { controlId: 'CC8.1' }]);
    const auditor = bearer(await f.token('ravi.auditor'));
    const a = await f.api.post('/api/audits').set(auditor).send({ frameworkCode: 'SOC2', title: 'Dash audit', scope: ['CC6.1', 'CC6.2'], targetEndDate: '2026-12-31' });
    await f.api.post(`/api/audits/${a.body.auditId}/transition`).set(auditor).send({ to: 'IN_PROGRESS' });
    for (const [controlId, owner, severity] of [['CC6.1', 'olivia.owner', 'CRITICAL'], ['CC6.2', 'omar.owner', 'LOW']] as const) {
      await f.api.post(`/api/audits/${a.body.auditId}/findings`).set(auditor).send({ controlId, severity, title: `Gap ${controlId}`, description: 'd', evidenceRef: 'e', ownerId: f.actor(owner).id });
    }
    f.clock.set('2026-10-10T09:00:00.000Z');
    return { f, auditId: a.body.auditId as string };
  }

  it('[AC-09] returns all five panels for compliance roles', async () => {
    const { f, auditId } = await setup();
    const res = await f.api.get('/api/dashboard').set(bearer(await f.token('rhea.reviewer')));
    expect(res.status).toBe(200);
    expect(res.body.coverage.find((c: { frameworkCode: string }) => c.frameworkCode === 'SOC2')).toMatchObject({ published: 4, assessed: 2, coveragePct: 50 });
    expect(res.body.openBySeverity).toEqual({ CRITICAL: 1, HIGH: 0, MEDIUM: 0, LOW: 1 });
    expect(res.body.overdueByOwner).toEqual([{ owner: 'olivia.owner', ownerName: 'Olivia Owner', count: 1, maxDaysOverdue: 2 }]);
    expect(res.body.auditProgress).toEqual([expect.objectContaining({ auditId, state: 'IN_PROGRESS', progressPct: 25, findingsTotal: 2 })]);
    expect(res.body.frameworks.map((x: { frameworkCode: string }) => x.frameworkCode)).toEqual(['CIS', 'ISO27001', 'SOC2']);
  });

  it('[AC-09][NFR-04] owners get 403 on the global dashboard and only their own summary on /me', async () => {
    const { f } = await setup();
    const omar = bearer(await f.token('omar.owner'));
    expect((await f.api.get('/api/dashboard').set(omar)).status).toBe(403);
    const me = await f.api.get('/api/dashboard/me').set(omar);
    expect(me.body).toMatchObject({ open: 1, overdue: 0, openBySeverity: { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 1 } });
    expect((await f.api.get('/api/dashboard/me').set(bearer(await f.token('ravi.auditor')))).status).toBe(403);
  });
});
