/**
 * Appends checksums for new migration files to server/migrations/migrations.lock.json.
 * Never rewrites an existing entry: if a locked file changed, it fails (NFR-05).
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { MIGRATIONS_DIR, listMigrations } from '../server/src/infrastructure/migrations';

const lockPath = join(MIGRATIONS_DIR, 'migrations.lock.json');
const lock: Record<string, string> = existsSync(lockPath) ? JSON.parse(readFileSync(lockPath, 'utf8')) : {};
let added = 0;
for (const m of listMigrations()) {
  if (m.name in lock) {
    if (lock[m.name] !== m.checksum) {
      console.error(`${m.name} changed after it was locked. Restore it and add a new migration.`);
      process.exit(1);
    }
    continue;
  }
  lock[m.name] = m.checksum;
  added++;
  console.log(`locked ${m.name}`);
}
writeFileSync(lockPath, JSON.stringify(lock, null, 2) + '\n');
console.log(added ? `${added} migration(s) locked` : 'lock file up to date');
