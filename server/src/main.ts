import { resolve } from 'node:path';
import { createApp } from './app';
import { fixedClock, systemClock } from './infrastructure/clock';
import { openDatabase } from './infrastructure/db';
import { createLogger, parseLevel } from './infrastructure/logging/logger';
import { runMigrations } from './infrastructure/migrations';
import { seedIfEmpty } from './seed/seed';

const port = Number(process.env.PORT ?? 3000);
const dbPath = process.env.DB_PATH ?? resolve(import.meta.dirname, '../../data/securegate.db');
// Synthetic development secret. Set TOKEN_SECRET outside local demos.
const tokenSecret = process.env.TOKEN_SECRET ?? 'securegate-local-demo-secret';
const logger = createLogger({ level: parseLevel(process.env.LOG_LEVEL) });

const db = openDatabase(dbPath);
const applied = runMigrations(db);
if (applied.length) logger.info('db.migrated', { applied });

// FIXED_NOW pins the clock for deterministic demos and Playwright snapshots.
const clock = process.env.FIXED_NOW ? fixedClock(process.env.FIXED_NOW) : systemClock;

const ctx = createApp({
  db,
  clock,
  logger,
  tokenSecret,
  webDist: process.env.SERVE_WEB === 'false' ? null : undefined,
});
const seeded = seedIfEmpty(ctx);
if (seeded) logger.info('db.seeded', seeded);

const server = ctx.app.listen(port, () => {
  logger.info('server.listening', { port, url: `http://localhost:${port}` });
});

const shutdown = () => server.close(() => process.exit(0));
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
