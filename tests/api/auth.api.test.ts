import { beforeEach, describe, expect, it } from 'vitest';
import { bearer, makeFixture, type Fixture } from '../helpers/fixture';
import { signToken } from '../../server/src/infrastructure/auth/tokens';

let f: Fixture;
beforeEach(() => {
  f = makeFixture();
});

describe('[NFR-04] authentication boundary', () => {
  it('[NFR-04][AC-10] sign-in returns a token and the user with role', async () => {
    const res = await f.api.post('/api/auth/login').send({ username: 'ravi.auditor' });
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ username: 'ravi.auditor', role: 'AUDITOR' });
    const me = await f.api.get('/api/auth/me').set(bearer(res.body.token));
    expect(me.body).toMatchObject({ username: 'ravi.auditor', role: 'AUDITOR' });
  });

  it('[NFR-04] unknown users cannot sign in', async () => {
    expect((await f.api.post('/api/auth/login').send({ username: 'mallory' })).status).toBe(401);
    expect((await f.api.post('/api/auth/login').send({})).status).toBe(400);
  });

  it('[NFR-04] protected routes need a token (401) and reject tampered or expired tokens', async () => {
    expect((await f.api.get('/api/audits')).status).toBe(401);
    const good = await f.token('ravi.auditor');
    const tampered = good.slice(0, -2) + (good.endsWith('A') ? 'BB' : 'AA');
    expect((await f.api.get('/api/audits').set(bearer(tampered))).status).toBe(401);

    const u = f.actor('ravi.auditor');
    const old = signToken({ sub: u.id, role: u.role, username: u.username }, 'test-secret-not-for-production', new Date('2026-01-01T00:00:00Z'));
    expect((await f.api.get('/api/audits').set(bearer(old))).status).toBe(401);
  });

  it('[NFR-04] a token signed with another secret is rejected', async () => {
    const u = f.actor('alice.admin');
    const forged = signToken({ sub: u.id, role: 'ADMIN', username: u.username }, 'attacker-secret', f.clock.now());
    expect((await f.api.get('/api/admin/users').set(bearer(forged))).status).toBe(401);
  });

  it('[NFR-04] the role comes from the database, not from the token claims', async () => {
    const u = f.actor('olivia.owner');
    const escalated = signToken({ sub: u.id, role: 'ADMIN', username: u.username }, 'test-secret-not-for-production', f.clock.now());
    expect((await f.api.get('/api/admin/users').set(bearer(escalated))).status).toBe(403);
  });
});

describe('[AC-10] user administration', () => {
  it('[AC-10] admin creates a user who can then sign in', async () => {
    const admin = bearer(await f.token('alice.admin'));
    const created = await f.api.post('/api/admin/users').set(admin).send({ username: 'nina.owner', displayName: 'Nina Owner', role: 'OWNER' });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ username: 'nina.owner', role: 'OWNER', active: true });
    const login = await f.api.post('/api/auth/login').send({ username: 'nina.owner' });
    expect(login.status).toBe(200);
  });

  it('[AC-10] rejects duplicates and unknown roles', async () => {
    const admin = bearer(await f.token('alice.admin'));
    expect((await f.api.post('/api/admin/users').set(admin).send({ username: 'ravi.auditor', displayName: 'Dup', role: 'AUDITOR' })).status).toBe(409);
    const bad = await f.api.post('/api/admin/users').set(admin).send({ username: 'x', displayName: 'Xavier', role: 'GOD' });
    expect(bad.status).toBe(400);
    expect(Object.keys(bad.body.fields).sort()).toEqual(['role', 'username']);
  });

  it('[AC-10][NFR-04] only admins manage users; auditors can list owners to assign findings', async () => {
    expect((await f.api.get('/api/admin/users').set(bearer(await f.token('ravi.auditor')))).status).toBe(403);
    const owners = await f.api.get('/api/users?role=OWNER').set(bearer(await f.token('ravi.auditor')));
    expect(owners.status).toBe(200);
    expect(owners.body.map((u: { username: string }) => u.username)).toEqual(['olivia.owner', 'omar.owner']);
    expect((await f.api.get('/api/users?role=OWNER').set(bearer(await f.token('olivia.owner')))).status).toBe(403);
  });
});
