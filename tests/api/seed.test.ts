import { describe, expect, it } from 'vitest';
import { createApp } from '../../server/src/app';
import { fixedClock } from '../../server/src/infrastructure/clock';
import { openDatabase } from '../../server/src/infrastructure/db';
import { createLogger } from '../../server/src/infrastructure/logging/logger';
import { runMigrations } from '../../server/src/infrastructure/migrations';
import { seedIfEmpty } from '../../server/src/seed/seed';

// KD-05: the seed replays history through the real services, so it must itself pass every rule.
describe('[AC-04][AC-08] synthetic seed data', () => {
  const build = () => {
    const db = openDatabase(':memory:');
    runMigrations(db);
    return createApp({ db, clock: fixedClock('2026-10-22T09:00:00.000Z'), logger: createLogger({ level: 'silent' }), tokenSecret: 't', webDist: null });
  };

  it('[AC-04][AC-08] seeds users, controls, audits and findings including overdue ones', () => {
    const ctx = build();
    expect(seedIfEmpty(ctx)).toEqual({ users: 7, controls: 20, audits: 3, findings: 5 });
    const admin = { id: ctx.repos.users.findByUsername('alice.admin')!.id, role: 'ADMIN' as const, username: 'alice.admin' };
    const states = ctx.services.findings.list(admin).map((f) => f.state);
    expect(states).toEqual(['OPEN', 'RE_OPEN', 'AWAITING_REVIEW', 'OPEN', 'REMEDIATED']);
    expect(ctx.services.findings.escalations(admin).map((f) => f.findingId)).toEqual(['FND-00001', 'FND-00002']);
  });

  it('[AC-04] seeding is idempotent', () => {
    const ctx = build();
    seedIfEmpty(ctx);
    expect(seedIfEmpty(ctx)).toBeNull();
  });
});
