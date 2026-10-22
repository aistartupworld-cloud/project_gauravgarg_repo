import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { Database } from './db';

export const MIGRATIONS_DIR = resolve(import.meta.dirname, '../../migrations');

export class MigrationChecksumError extends Error {
  constructor(name: string) {
    super(`Applied migration ${name} has changed on disk. Migrations are append-only (NFR-05): restore it and add a new migration.`);
    this.name = 'MigrationChecksumError';
  }
}

export interface MigrationFile {
  name: string;
  sql: string;
  checksum: string;
}

export function checksum(sql: string): string {
  return createHash('sha256').update(sql).digest('hex');
}

export function listMigrations(dir = MIGRATIONS_DIR): MigrationFile[] {
  return readdirSync(dir)
    .filter((f) => /^\d{3}_[a-z0-9_]+\.sql$/.test(f))
    .sort()
    .map((name) => {
      const sql = readFileSync(join(dir, name), 'utf8');
      return { name, sql, checksum: checksum(sql) };
    });
}

/** Applies pending migrations in order and verifies applied ones are unchanged. Returns names applied now. */
export function runMigrations(db: Database, dir = MIGRATIONS_DIR): string[] {
  db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
    name TEXT PRIMARY KEY,
    checksum TEXT NOT NULL,
    applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
  )`);
  const applied = new Map(
    (db.prepare('SELECT name, checksum FROM schema_migrations').all() as Array<{ name: string; checksum: string }>).map(
      (r) => [r.name, r.checksum],
    ),
  );
  const ran: string[] = [];
  for (const m of listMigrations(dir)) {
    const prior = applied.get(m.name);
    if (prior !== undefined) {
      if (prior !== m.checksum) throw new MigrationChecksumError(m.name);
      continue;
    }
    db.exec('BEGIN');
    try {
      db.exec(m.sql);
      db.prepare('INSERT INTO schema_migrations (name, checksum) VALUES (?, ?)').run(m.name, m.checksum);
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
    ran.push(m.name);
  }
  return ran;
}
