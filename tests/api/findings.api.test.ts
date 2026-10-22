import { beforeEach, describe, expect, it } from 'vitest';
import { bearer, makeFixture, type Fixture } from '../helpers/fixture';

let f: Fixture;
let auditId: string;

beforeEach(async () => {
  f = makeFixture({ today: '2026-10-01' });
  f.publishControls('SOC2', [
    { controlId: 'CC6.1', severity: 'HIGH' },
    { controlId: 'CC6.6', severity: 'CRITICAL' },
    { controlId: 'CC7.2', severity: 'MEDIUM' },
    { controlId: 'CC8.1', severity: 'LOW' },
  ]);
  const auditor = bearer(await f.token('ravi.auditor'));
  const a = await f.api
    .post('/api/audits')
    .set(auditor)
    .send({ frameworkCode: 'SOC2', title: 'Findings audit', scope: ['CC6.1', 'CC6.6', 'CC7.2'], targetEndDate: '2026-12-31' });
  auditId = a.body.auditId;
  await f.api.post(`/api/audits/${auditId}/transition`).set(auditor).send({ to: 'IN_PROGRESS' });
});

async function record(overrides: Record<string, unknown> = {}, user = 'ravi.auditor') {
  return f.api
    .post(`/api/audits/${auditId}/findings`)
    .set(bearer(await f.token(user)))
    .send({
      controlId: 'CC6.1',
      severity: 'HIGH',
      title: 'Stale accounts not disabled',
      description: '14 leaver accounts still active on the payroll app (synthetic).',
      evidenceRef: 'TICKET-1042 screenshot 3',
      ownerId: f.actor('olivia.owner').id,
      ...overrides,
    });
}

describe('[AC-04] recording findings', () => {
  it('[AC-04][AC-05] a recorded finding is OPEN with owner, SLA due date and pinned rule version', async () => {
    const res = await record();
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      findingId: 'FND-00001',
      auditId,
      controlId: 'CC6.1',
      controlVersion: 1,
      severity: 'HIGH',
      state: 'OPEN',
      owner: 'olivia.owner',
      raisedBy: 'ravi.auditor',
      detectedOn: '2026-10-01',
      dueDate: '2026-10-31',
      slaRuleSetVersion: 1,
      evidenceRef: 'TICKET-1042 screenshot 3',
      escalated: false,
    });
    expect(res.body.events).toEqual([expect.objectContaining({ fromState: null, toState: 'OPEN', actor: 'ravi.auditor' })]);
    expect((await record()).body.findingId).toBe('FND-00002');
  });

  it('[AC-04] severity defaults to the control default severity', async () => {
    const res = await record({ controlId: 'CC6.6', severity: undefined });
    expect(res.body).toMatchObject({ severity: 'CRITICAL', dueDate: '2026-10-08' });
  });

  it('[AC-04] rejects controls outside the audit scope and unknown controls', async () => {
    expect((await record({ controlId: 'CC8.1' })).status).toBe(400);
    expect((await record({ controlId: 'A.5.1' })).status).toBe(400);
  });

  it('[AC-04] owner must be an active OWNER and not the raising auditor', async () => {
    expect((await record({ ownerId: f.actor('rhea.reviewer').id })).status).toBe(400);
    expect((await record({ ownerId: 99999 })).status).toBe(400);
  });

  it('[AC-04] requires description and evidence reference', async () => {
    const res = await record({ description: '', evidenceRef: '' });
    expect(res.status).toBe(400);
    expect(Object.keys(res.body.fields).sort()).toEqual(['description', 'evidenceRef']);
  });

  it('[AC-04][AC-03] findings cannot be recorded on a PLANNED audit', async () => {
    const auditor = bearer(await f.token('ravi.auditor'));
    const planned = await f.api
      .post('/api/audits')
      .set(auditor)
      .send({ frameworkCode: 'SOC2', title: 'Still planned', scope: [], targetEndDate: '2026-12-31' });
    const res = await f.api
      .post(`/api/audits/${planned.body.auditId}/findings`)
      .set(auditor)
      .send({ controlId: 'CC6.1', title: 'x finding', description: 'd', evidenceRef: 'e', ownerId: f.actor('olivia.owner').id });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('INVALID_AUDIT_STATE');
  });

  it('[AC-04][AC-10] only auditors record findings', async () => {
    for (const u of ['alice.admin', 'olivia.owner', 'rhea.reviewer']) expect((await record({}, u)).status, u).toBe(403);
  });

  it('[AC-03] with a finding recorded the audit can move to FINDINGS_RECORDED', async () => {
    await record();
    const res = await f.api.post(`/api/audits/${auditId}/transition`).set(bearer(await f.token('ravi.auditor'))).send({ to: 'FINDINGS_RECORDED' });
    expect(res.status).toBe(200);
    expect(res.body.state).toBe('FINDINGS_RECORDED');
  });

  it('[AC-03] the audit cannot close while a finding is open', async () => {
    await record();
    const auditor = bearer(await f.token('ravi.auditor'));
    for (const to of ['FINDINGS_RECORDED', 'REMEDIATION_IN_PROGRESS']) {
      expect((await f.api.post(`/api/audits/${auditId}/transition`).set(auditor).send({ to })).status).toBe(200);
    }
    const res = await f.api.post(`/api/audits/${auditId}/transition`).set(auditor).send({ to: 'CLOSED' });
    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/1 finding\(s\) not remediated/);
  });
});

describe('[NFR-04] owner-scoped finding access', () => {
  it('[NFR-04][AC-04] owners only see findings assigned to them', async () => {
    const mine = await record();
    const theirs = await record({ ownerId: f.actor('omar.owner').id, title: 'Omar finding' });
    const olivia = bearer(await f.token('olivia.owner'));

    const list = await f.api.get('/api/findings').set(olivia);
    expect(list.body.map((x: { findingId: string }) => x.findingId)).toEqual([mine.body.findingId]);
    expect((await f.api.get(`/api/findings/${mine.body.findingId}`).set(olivia)).status).toBe(200);
    expect((await f.api.get(`/api/findings/${theirs.body.findingId}`).set(olivia)).status).toBe(404);
  });

  it('[NFR-04] auditors and reviewers see all findings and can filter', async () => {
    await record();
    await record({ controlId: 'CC6.6', severity: 'CRITICAL', ownerId: f.actor('omar.owner').id });
    const rhea = bearer(await f.token('rhea.reviewer'));
    expect((await f.api.get('/api/findings').set(rhea)).body).toHaveLength(2);
    expect((await f.api.get('/api/findings?severity=CRITICAL').set(rhea)).body).toHaveLength(1);
    expect((await f.api.get(`/api/findings?auditId=${auditId}&state=OPEN`).set(rhea)).body).toHaveLength(2);
    expect((await f.api.get('/api/findings?state=BOGUS').set(rhea)).status).toBe(400);
  });
});
