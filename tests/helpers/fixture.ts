import request from 'supertest';
import { createApp, type AppContext } from '../../server/src/app';
import { openDatabase } from '../../server/src/infrastructure/db';
import { runMigrations } from '../../server/src/infrastructure/migrations';
import { fixedClock, type MutableClock } from '../../server/src/infrastructure/clock';
import { createLogger, memorySink, type MemorySink } from '../../server/src/infrastructure/logger';
import type { Actor, Role, Severity } from '../../server/src/domain/types';

export const STANDARD_USERS: Array<{ username: string; displayName: string; role: Role }> = [
  { username: 'alice.admin', displayName: 'Alice Admin', role: 'ADMIN' },
  { username: 'ravi.auditor', displayName: 'Ravi Auditor', role: 'AUDITOR' },
  { username: 'arun.auditor', displayName: 'Arun Auditor', role: 'AUDITOR' },
  { username: 'olivia.owner', displayName: 'Olivia Owner', role: 'OWNER' },
  { username: 'omar.owner', displayName: 'Omar Owner', role: 'OWNER' },
  { username: 'rhea.reviewer', displayName: 'Rhea Reviewer', role: 'REVIEWER' },
  { username: 'rob.reviewer', displayName: 'Rob Reviewer', role: 'REVIEWER' },
];

export interface Fixture {
  ctx: AppContext;
  clock: MutableClock;
  logs: MemorySink;
  api: ReturnType<typeof request>;
  actor(username: string): Actor;
  token(username: string): Promise<string>;
  publishControls(frameworkCode: string, controls: Array<{ controlId: string; severity?: Severity; category?: string }>): void;
}

export function makeFixture(opts: { today?: string } = {}): Fixture {
  const db = openDatabase(':memory:');
  runMigrations(db);
  const clock = fixedClock(`${opts.today ?? '2026-10-01'}T09:00:00.000Z`);
  const logs = memorySink();
  const logger = createLogger({ sink: logs.write, level: 'debug' });
  const ctx = createApp({ db, clock, logger, tokenSecret: 'test-secret-not-for-production' });

  for (const u of STANDARD_USERS) ctx.repos.users.insert({ ...u, createdAt: clock.now().toISOString() });

  const actor = (username: string): Actor => {
    const u = ctx.repos.users.findByUsername(username);
    if (!u) throw new Error(`fixture user ${username} missing`);
    return { id: u.id, role: u.role, username: u.username };
  };

  const tokens = new Map<string, string>();
  const token = async (username: string) => {
    const cached = tokens.get(username);
    if (cached) return cached;
    const res = await request(ctx.app).post('/api/auth/login').send({ username });
    if (res.status !== 200) throw new Error(`login ${username} failed: ${res.status} ${JSON.stringify(res.body)}`);
    tokens.set(username, res.body.token);
    return res.body.token as string;
  };

  const publishControls: Fixture['publishControls'] = (frameworkCode, controls) => {
    const admin = actor('alice.admin');
    for (const c of controls) {
      const draft = ctx.services.controls.createDraft(admin, {
        frameworkCode,
        controlId: c.controlId,
        title: `Control ${c.controlId}`,
        description: `Synthetic control ${c.controlId} for tests`,
        category: c.category ?? 'Access Control',
        defaultSeverity: c.severity ?? 'HIGH',
      });
      ctx.services.controls.publish(admin, draft.id);
    }
  };

  return { ctx, clock, logs, api: request(ctx.app), actor, token, publishControls };
}

export function bearer(token: string) {
  return { Authorization: `Bearer ${token}` };
}
