import { beforeEach, describe, expect, it } from 'vitest';
import { bearer, makeFixture, type Fixture } from '../helpers/fixture';

// Reviewer (evaluator) scenarios for NFR-08 separation of duties — see docs/fix-loops/001-sod-self-approval.md.
let f: Fixture;
let findingId: string;

beforeEach(async () => {
  f = makeFixture({ today: '2026-10-01' });
  f.publishControls('SOC2', [{ controlId: 'CC6.1' }]);
  const auditor = bearer(await f.token('ravi.auditor'));
  const a = await f.api.post('/api/audits').set(auditor).send({ frameworkCode: 'SOC2', title: 'SoD audit', scope: [], targetEndDate: '2026-12-31' });
  await f.api.post(`/api/audits/${a.body.auditId}/transition`).set(auditor).send({ to: 'IN_PROGRESS' });
  const rec = await f.api.post(`/api/audits/${a.body.auditId}/findings`).set(auditor).send({
    controlId: 'CC6.1',
    title: 'MFA not enforced for admins',
    description: 'Synthetic',
    evidenceRef: 'WP-2',
    ownerId: f.actor('olivia.owner').id,
  });
  findingId = rec.body.findingId;
  await f.api
    .post(`/api/findings/${findingId}/evidence`)
    .set(bearer(await f.token('olivia.owner')))
    .send({ fileName: 'mfa-policy.png', contentType: 'image/png', sizeBytes: 9000, sha256: 'd'.repeat(64) });
});

async function makeReviewer(username: string) {
  const admin = bearer(await f.token('alice.admin'));
  const res = await f.api.patch(`/api/admin/users/${f.actor(username).id}/role`).set(admin).send({ role: 'REVIEWER' });
  expect(res.status).toBe(200);
}

async function approveAs(username: string) {
  const login = await f.api.post('/api/auth/login').send({ username });
  return f.api
    .post(`/api/findings/${findingId}/review`)
    .set(bearer(login.body.token))
    .send({ decision: 'REMEDIATED', comment: 'Looks fixed to me.' });
}

describe('[NFR-08] separation of duties on remediation approval', () => {
  it('[NFR-08][AC-07] an owner who later became a reviewer cannot approve their own remediation', async () => {
    await makeReviewer('olivia.owner');
    const res = await approveAs('olivia.owner');
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('SOD_VIOLATION');
    const after = await f.api.get(`/api/findings/${findingId}`).set(bearer(await f.token('alice.admin')));
    expect(after.body.state).toBe('AWAITING_REVIEW');
  });

  it('[NFR-08] the auditor who raised the finding cannot approve it after becoming a reviewer', async () => {
    await makeReviewer('ravi.auditor');
    const res = await approveAs('ravi.auditor');
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('SOD_VIOLATION');
  });

  it('[NFR-08] conflicted users cannot send it back either (spec: any decision)', async () => {
    await makeReviewer('olivia.owner');
    const login = await f.api.post('/api/auth/login').send({ username: 'olivia.owner' });
    const res = await f.api
      .post(`/api/findings/${findingId}/review`)
      .set(bearer(login.body.token))
      .send({ decision: 'RE_OPEN', comment: 'Uploaded the wrong file.' });
    expect(res.status).toBe(403);
  });

  it('[NFR-08] an independent reviewer can approve', async () => {
    const res = await approveAs('rhea.reviewer');
    expect(res.status).toBe(200);
    expect(res.body.state).toBe('REMEDIATED');
  });
});
