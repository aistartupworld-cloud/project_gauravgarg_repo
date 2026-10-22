import { beforeEach, describe, expect, it } from 'vitest';
import { bearer, makeFixture, type Fixture } from '../helpers/fixture';

let f: Fixture;
beforeEach(() => {
  f = makeFixture();
});

const body = {
  frameworkCode: 'ISO27001',
  controlId: 'A.5.1',
  title: 'Policies for information security',
  description: 'Management direction for information security (synthetic).',
  category: 'Organizational',
  defaultSeverity: 'HIGH',
};

describe('[AC-01] controls library API', () => {
  it('[AC-01] admin creates a draft, publishes it, and it becomes readable', async () => {
    const admin = bearer(await f.token('alice.admin'));
    const created = await f.api.post('/api/admin/controls').set(admin).send(body);
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ controlId: 'A.5.1', version: 1, status: 'DRAFT' });

    const auditor = bearer(await f.token('ravi.auditor'));
    expect((await f.api.get('/api/controls?framework=ISO27001').set(auditor)).body).toEqual([]);

    const pub = await f.api.post(`/api/admin/controls/${created.body.id}/publish`).set(admin);
    expect(pub.status).toBe(200);
    expect(pub.body.status).toBe('PUBLISHED');

    const list = await f.api.get('/api/controls?framework=ISO27001').set(auditor);
    expect(list.body).toHaveLength(1);
    expect(list.body[0]).toMatchObject({ controlId: 'A.5.1', version: 1, defaultSeverity: 'HIGH', category: 'Organizational' });
  });

  it('[AC-01][NFR-08] a published control cannot be edited through the API', async () => {
    const admin = bearer(await f.token('alice.admin'));
    const { body: c } = await f.api.post('/api/admin/controls').set(admin).send(body);
    await f.api.post(`/api/admin/controls/${c.id}/publish`).set(admin);
    const patch = await f.api.patch(`/api/admin/controls/${c.id}`).set(admin).send({ title: 'Changed title' });
    expect(patch.status).toBe(409);
    expect(patch.body.code).toBe('IMMUTABLE_RECORD');
    const again = await f.api.get('/api/controls?framework=ISO27001').set(admin);
    expect(again.body[0].title).toBe(body.title);
  });

  it('[AC-01][NFR-02] the database itself refuses to mutate a published control', async () => {
    f.publishControls('SOC2', [{ controlId: 'CC6.1' }]);
    expect(() => f.ctx.db.exec("UPDATE control_versions SET title = 'tampered' WHERE control_id = 'CC6.1'")).toThrow(
      /published control versions are immutable/,
    );
    expect(() => f.ctx.db.exec("DELETE FROM control_versions WHERE control_id = 'CC6.1'")).toThrow(/immutable/);
  });

  it('[AC-01] drafts can be edited, and revising a published control creates version 2', async () => {
    const admin = bearer(await f.token('alice.admin'));
    const { body: c } = await f.api.post('/api/admin/controls').set(admin).send(body);
    const edited = await f.api.patch(`/api/admin/controls/${c.id}`).set(admin).send({ title: 'Policies (draft edit)' });
    expect(edited.status).toBe(200);
    expect(edited.body.title).toBe('Policies (draft edit)');
    await f.api.post(`/api/admin/controls/${c.id}/publish`).set(admin);

    const rev = await f.api.post(`/api/admin/controls/${c.id}/revise`).set(admin).send({ title: 'Policies v2' });
    expect(rev.status).toBe(201);
    expect(rev.body).toMatchObject({ controlId: 'A.5.1', version: 2, status: 'DRAFT', title: 'Policies v2' });

    const dup = await f.api.post(`/api/admin/controls/${c.id}/revise`).set(admin).send({});
    expect(dup.status).toBe(409);

    const all = await f.api.get('/api/admin/controls?framework=ISO27001').set(admin);
    expect(all.body.map((r: { version: number; status: string }) => `${r.version}:${r.status}`)).toEqual([
      '1:PUBLISHED',
      '2:DRAFT',
    ]);
  });

  it('[AC-01] rejects invalid input with field messages and duplicate controls with 409', async () => {
    const admin = bearer(await f.token('alice.admin'));
    const bad = await f.api.post('/api/admin/controls').set(admin).send({ ...body, defaultSeverity: 'SEVERE', controlId: 'bad id' });
    expect(bad.status).toBe(400);
    expect(Object.keys(bad.body.fields).sort()).toEqual(['controlId', 'defaultSeverity']);
    await f.api.post('/api/admin/controls').set(admin).send(body);
    expect((await f.api.post('/api/admin/controls').set(admin).send(body)).status).toBe(409);
  });

  it('[AC-01][AC-10] non-admins cannot manage controls', async () => {
    for (const u of ['ravi.auditor', 'olivia.owner', 'rhea.reviewer']) {
      const res = await f.api.post('/api/admin/controls').set(bearer(await f.token(u))).send(body);
      expect(res.status, u).toBe(403);
    }
  });

  it('[AC-01] lists frameworks', async () => {
    const res = await f.api.get('/api/frameworks').set(bearer(await f.token('olivia.owner')));
    expect(res.body.map((x: { code: string }) => x.code)).toEqual(['CIS', 'ISO27001', 'SOC2']);
  });
});
