# server/migrations — append-only (NFR-05)

- Files are `NNN_snake_case.sql`, applied in order, recorded with a SHA-256 checksum in `schema_migrations`.
- **Never edit or delete an existing file.** Add a new numbered file instead. The runner refuses to start when a
  checksum changes, `migration-append-only-check.sh` blocks the edit, and `tests/architecture/migrations.test.ts`
  compares every file to `migrations.lock.json`.
- After adding a migration, run `npm run migrations:lock` to append its checksum.
