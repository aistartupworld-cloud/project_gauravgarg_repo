import { createHash } from 'node:crypto';
import { readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { read } from './support';
import { openDatabase } from '../../server/src/infrastructure/db';
import { MigrationChecksumError, runMigrations } from '../../server/src/infrastructure/migrations';

const DIR = 'server/migrations';
const lock: Record<string, string> = JSON.parse(read(`${DIR}/migrations.lock.json`));

describe('[NFR-05] migrations are append-only', () => {
  const files = readdirSync(DIR).filter((f) => f.endsWith('.sql')).sort();

  it('[NFR-05] files are numbered contiguously from 001', () => {
    files.forEach((f, i) => expect(f).toMatch(new RegExp(`^${String(i + 1).padStart(3, '0')}_[a-z0-9_]+\\.sql$`)));
  });

  it('[NFR-05] every locked migration still exists with the same checksum', () => {
    for (const [file, sum] of Object.entries(lock)) {
      expect(files, `${file} was deleted`).toContain(file);
      const now = createHash('sha256').update(read(`${DIR}/${file}`)).digest('hex');
      expect(now, `${file} was edited after being locked — add a new migration instead`).toBe(sum);
    }
  });

  it('[NFR-05] every migration file is locked', () => {
    expect(files.filter((f) => !(f in lock))).toEqual([]);
  });

  it('[NFR-05] the runner refuses to start when an applied migration changed', () => {
    const db = openDatabase(':memory:');
    runMigrations(db);
    db.prepare('UPDATE schema_migrations SET checksum = ? WHERE name = ?').run('0'.repeat(64), files[0]!);
    expect(() => runMigrations(db)).toThrow(MigrationChecksumError);
  });

  it('[NFR-05] running migrations twice is a no-op', () => {
    const db = openDatabase(':memory:');
    runMigrations(db);
    expect(runMigrations(db)).toEqual([]);
  });
});
