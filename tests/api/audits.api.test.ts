import { beforeEach, describe, expect, it } from 'vitest';
import { bearer, makeFixture, type Fixture } from '../helpers/fixture';

let f: Fixture;
beforeEach(() => {
  f = makeFixture({ today: '2026-10-01' });
  f.publishControls('SOC2', [{ controlId: 'CC6.1' }, { controlId: 'CC6.2' }, { controlId: 'CC7.2' }, { controlId: 'CC8.1' }]);
});

const plan = { frameworkCode: 'SOC2', title: 'Q4 SOC 2 readiness', scope: ['CC6.1', 'CC7.2'], targetEndDate: '2026-12-15' };

async function createAudit(overrides: Record<string, unknown> = {}) {
  return f.api.post('/api/audits').set(bearer(await f.token('ravi.auditor'))).send({ ...plan, ...overrides });
}

async function move(auditId: string, to: string, user = 'ravi.auditor') {
  return f.api.post(`/api/audits/${auditId}/transition`).set(bearer(await f.token(user))).send({ to });
}

describe('[AC-02] audit planning API', () => {
  it('[AC-02] auditor creates an audit that starts PLANNED with a unique id', async () => {
    const a = await createAudit();
    expect(a.status).toBe(201);
    expect(a.body).toMatchObject({
      auditId: 'AUD-2026-0001',
      state: 'PLANNED',
      frameworkCode: 'SOC2',
      scope: ['CC6.1', 'CC7.2'],
      targetEndDate: '2026-12-15',
    });
    const b = await createAudit({ title: 'Second audit' });
    expect(b.body.auditId).toBe('AUD-2026-0002');
  });

  it('[AC-02] records the creation as the first lifecycle event', async () => {
    const a = await createAudit();
    const got = await f.api.get(`/api/audits/${a.body.auditId}`).set(bearer(await f.token('rhea.reviewer')));
    expect(got.status).toBe(200);
    expect(got.body.events).toEqual([
      expect.objectContaining({ seq: 1, fromState: null, toState: 'PLANNED', actor: 'ravi.auditor' }),
    ]);
  });

  it('[AC-02] rejects scope outside the framework, past dates and unknown frameworks', async () => {
    expect((await createAudit({ scope: ['A.5.1'] })).status).toBe(400);
    expect((await createAudit({ targetEndDate: '2026-09-01' })).status).toBe(400);
    expect((await createAudit({ frameworkCode: 'NOPE' })).status).toBe(400);
  });

  it('[AC-02][AC-10] only auditors may create audits', async () => {
    for (const u of ['alice.admin', 'olivia.owner', 'rhea.reviewer']) {
      const res = await f.api.post('/api/audits').set(bearer(await f.token(u))).send(plan);
      expect(res.status, u).toBe(403);
    }
  });

  it('[AC-02][NFR-04] owners cannot read audits', async () => {
    const res = await f.api.get('/api/audits').set(bearer(await f.token('olivia.owner')));
    expect(res.status).toBe(403);
  });
});

describe('[AC-03] audit lifecycle API', () => {
  it('[AC-03] PLANNED → IN_PROGRESS appends an event', async () => {
    const { body } = await createAudit();
    const res = await move(body.auditId, 'IN_PROGRESS');
    expect(res.status).toBe(200);
    expect(res.body.state).toBe('IN_PROGRESS');
    expect(res.body.events.map((e: { toState: string }) => e.toState)).toEqual(['PLANNED', 'IN_PROGRESS']);
  });

  it('[AC-03] skipping a state raises InvalidAuditStateException (409)', async () => {
    const { body } = await createAudit();
    const res = await move(body.auditId, 'CLOSED');
    expect(res.status).toBe(409);
    expect(res.body).toMatchObject({ code: 'INVALID_AUDIT_STATE', error: 'InvalidAuditStateException' });
    const after = await f.api.get(`/api/audits/${body.auditId}`).set(bearer(await f.token('ravi.auditor')));
    expect(after.body.state).toBe('PLANNED');
  });

  it('[AC-03] cannot record findings stage without findings', async () => {
    const { body } = await createAudit();
    await move(body.auditId, 'IN_PROGRESS');
    const res = await move(body.auditId, 'FINDINGS_RECORDED');
    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/at least one finding/);
  });

  it('[AC-03] unknown target state is a 400, unknown audit a 404', async () => {
    const { body } = await createAudit();
    expect((await move(body.auditId, 'DONE')).status).toBe(400);
    expect((await move('AUD-2026-9999', 'IN_PROGRESS')).status).toBe(404);
  });

  it('[AC-03][AC-10] owners and reviewers cannot transition audits; admins can', async () => {
    const { body } = await createAudit();
    expect((await move(body.auditId, 'IN_PROGRESS', 'olivia.owner')).status).toBe(403);
    expect((await move(body.auditId, 'IN_PROGRESS', 'rhea.reviewer')).status).toBe(403);
    expect((await move(body.auditId, 'IN_PROGRESS', 'alice.admin')).status).toBe(200);
  });
});
