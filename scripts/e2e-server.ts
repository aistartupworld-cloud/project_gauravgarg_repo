// Starts a fresh, deterministic SecureGate for Playwright: new DB, pinned clock, built UI.
import { rmSync } from 'node:fs';
import { resolve } from 'node:path';

const db = resolve(import.meta.dirname, '../data/e2e.db');
for (const suffix of ['', '-wal', '-shm']) rmSync(db + suffix, { force: true });
process.env.DB_PATH = db;
process.env.PORT ??= '3100';
process.env.FIXED_NOW ??= '2026-10-22T09:00:00.000Z';
process.env.LOG_LEVEL ??= 'warn';
await import('../server/src/main');
