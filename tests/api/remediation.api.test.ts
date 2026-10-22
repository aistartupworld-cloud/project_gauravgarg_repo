import { beforeEach, describe, expect, it } from 'vitest';
import { bearer, makeFixture, type Fixture } from '../helpers/fixture';

let f: Fixture;
let findingId: string;

const evidence = {
  fileName: 'access-review-2026Q4.csv',
  contentType: 'text/csv',
  sizeBytes: 2048,
  sha256: 'b'.repeat(64),
  note: 'Leavers disabled; see rows 3-17.',
};

beforeEach(async () => {
  f = makeFixture({ today: '2026-10-01' });
  f.publishControls('SOC2', [{ controlId: 'CC6.1', severity: 'HIGH' }]);
  const auditor = bearer(await f.token('ravi.auditor'));
  const a = await f.api.post('/api/audits').set(auditor).send({ frameworkCode: 'SOC2', title: 'Remediation audit', scope: [], targetEndDate: '2026-12-31' });
  await f.api.post(`/api/audits/${a.body.auditId}/transition`).set(auditor).send({ to: 'IN_PROGRESS' });
  const rec = await f.api.post(`/api/audits/${a.body.auditId}/findings`).set(auditor).send({
    controlId: 'CC6.1',
    title: 'Leaver accounts active',
    description: 'Synthetic',
    evidenceRef: 'WP-1',
    ownerId: f.actor('olivia.owner').id,
  });
  findingId = rec.body.findingId;
});

async function submit(user = 'olivia.owner', body: Record<string, unknown> = evidence) {
  return f.api.post(`/api/findings/${findingId}/evidence`).set(bearer(await f.token(user))).send(body);
}

async function review(decision: string, comment = 'Checked the export; leavers removed.', user = 'rhea.reviewer') {
  return f.api.post(`/api/findings/${findingId}/review`).set(bearer(await f.token(user))).send({ decision, comment });
}

describe('[AC-06] owner submits remediation evidence', () => {
  it('[AC-06] valid evidence moves the finding to AWAITING_REVIEW with a stub storage ref', async () => {
    const res = await submit();
    expect(res.status).toBe(201);
    expect(res.body.state).toBe('AWAITING_REVIEW');
    expect(res.body.evidence).toEqual([
      expect.objectContaining({
        evidenceId: 'EVD-00001',
        fileName: evidence.fileName,
        storageRef: `stub://evidence/${findingId}/EVD-00001`,
        uploadedBy: 'olivia.owner',
      }),
    ]);
    expect(res.body.events.map((e: { toState: string }) => e.toState)).toEqual(['OPEN', 'AWAITING_REVIEW']);
  });

  it('[AC-06] invalid metadata is rejected and the state does not change', async () => {
    const res = await submit('olivia.owner', { ...evidence, contentType: 'application/x-msdownload', sizeBytes: 30 * 1024 * 1024 });
    expect(res.status).toBe(400);
    expect(Object.keys(res.body.fields).sort()).toEqual(['contentType', 'sizeBytes']);
    const after = await f.api.get(`/api/findings/${findingId}`).set(bearer(await f.token('olivia.owner')));
    expect(after.body.state).toBe('OPEN');
    expect(after.body.evidence).toEqual([]);
  });

  it('[AC-06][NFR-04] another owner cannot submit (404) and other roles are forbidden (403)', async () => {
    expect((await submit('omar.owner')).status).toBe(404);
    expect((await submit('ravi.auditor')).status).toBe(403);
    expect((await submit('rhea.reviewer')).status).toBe(403);
  });

  it('[AC-06] cannot submit again while AWAITING_REVIEW', async () => {
    await submit();
    const res = await submit();
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('INVALID_FINDING_STATE');
  });

  it('[AC-06][AC-07] after RE_OPEN the owner can submit new evidence', async () => {
    await submit();
    await review('RE_OPEN', 'Export is missing the contractor tenant.');
    const res = await submit('olivia.owner', { ...evidence, fileName: 'access-review-v2.csv', sha256: 'c'.repeat(64) });
    expect(res.status).toBe(201);
    expect(res.body.state).toBe('AWAITING_REVIEW');
    expect(res.body.evidence).toHaveLength(2);
  });
});

describe('[AC-07] reviewer decides', () => {
  it('[AC-07] REMEDIATED with comment appends an audited event', async () => {
    await submit();
    const res = await review('REMEDIATED');
    expect(res.status).toBe(200);
    expect(res.body.state).toBe('REMEDIATED');
    expect(res.body.events.at(-1)).toMatchObject({
      fromState: 'AWAITING_REVIEW',
      toState: 'REMEDIATED',
      actor: 'rhea.reviewer',
      comment: 'Checked the export; leavers removed.',
      at: '2026-10-01T09:00:00.000Z',
    });
    expect(res.body.events).toHaveLength(3);
  });

  it('[AC-07] RE_OPEN with comment', async () => {
    await submit();
    const res = await review('RE_OPEN', 'Evidence does not cover production.');
    expect(res.body.state).toBe('RE_OPEN');
  });

  it('[AC-07] a comment is mandatory and the decision must be known', async () => {
    await submit();
    expect((await review('REMEDIATED', '')).status).toBe(400);
    expect((await review('APPROVED')).status).toBe(400);
  });

  it('[AC-07] decisions need AWAITING_REVIEW; REMEDIATED is final', async () => {
    expect((await review('REMEDIATED')).status).toBe(409);
    await submit();
    await review('REMEDIATED');
    const again = await review('RE_OPEN', 'Changed my mind');
    expect(again.status).toBe(409);
    expect(again.body.code).toBe('INVALID_FINDING_STATE');
  });

  it('[AC-07][AC-10] only reviewers decide', async () => {
    await submit();
    for (const u of ['alice.admin', 'ravi.auditor', 'olivia.owner']) {
      expect((await review('REMEDIATED', 'ok then', u)).status, u).toBe(403);
    }
  });

  it('[AC-07][NFR-02] earlier events are untouched and the DB refuses edits', async () => {
    await submit();
    const before = (await f.api.get(`/api/findings/${findingId}`).set(bearer(await f.token('rhea.reviewer')))).body.events;
    await review('RE_OPEN', 'Needs more');
    const after = (await f.api.get(`/api/findings/${findingId}`).set(bearer(await f.token('rhea.reviewer')))).body.events;
    expect(after.slice(0, before.length)).toEqual(before);
    expect(() => f.ctx.db.exec(`UPDATE finding_events SET comment = 'edited'`)).toThrow(/append-only/);
    expect(() => f.ctx.db.exec(`DELETE FROM evidence`)).toThrow(/append-only/);
  });

  it('[AC-07] the review queue lists findings awaiting review', async () => {
    const rhea = bearer(await f.token('rhea.reviewer'));
    expect((await f.api.get('/api/reviews/queue').set(rhea)).body).toEqual([]);
    await submit();
    const q = await f.api.get('/api/reviews/queue').set(rhea);
    expect(q.body.map((x: { findingId: string }) => x.findingId)).toEqual([findingId]);
    expect(q.body[0].evidence).toHaveLength(1);
    expect((await f.api.get('/api/reviews/queue').set(bearer(await f.token('olivia.owner')))).status).toBe(403);
  });
});

describe('[AC-10] role changes', () => {
  it('[AC-10] admin changes a role; assignments stay', async () => {
    const admin = bearer(await f.token('alice.admin'));
    const olivia = f.actor('olivia.owner');
    const res = await f.api.patch(`/api/admin/users/${olivia.id}/role`).set(admin).send({ role: 'REVIEWER' });
    expect(res.status).toBe(200);
    expect(res.body.role).toBe('REVIEWER');
    const login = await f.api.post('/api/auth/login').send({ username: 'olivia.owner' });
    expect(login.body.user.role).toBe('REVIEWER');
    const finding = await f.api.get(`/api/findings/${findingId}`).set(admin);
    expect(finding.body.owner).toBe('olivia.owner');
    expect((await f.api.patch(`/api/admin/users/${olivia.id}/role`).set(admin).send({ role: 'BOSS' })).status).toBe(400);
    expect((await f.api.patch(`/api/admin/users/${olivia.id}/role`).set(bearer(await f.token('ravi.auditor'))).send({ role: 'ADMIN' })).status).toBe(403);
  });
});
