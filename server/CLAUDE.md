# server/ — backend module

Inherits root `CLAUDE.md`. Node 22 (`node:sqlite`), Express 4, TypeScript run through `tsx`.

## Layout

| Folder | Role | May import |
|---|---|---|
| `src/domain` | Pure rules, types, errors | nothing outside `domain` |
| `src/repositories` | SQL over `DatabaseSync` | `domain`, `infrastructure/db` |
| `src/services` | Use cases, actor checks, logging context | `domain`, `repositories`, `infrastructure` |
| `src/controllers` | Routes, request validation, `requireRole` | `services`, `domain` (types/errors), `infrastructure/http` |
| `src/infrastructure` | Logger, clock, DB, migrations, auth tokens, HTTP helpers | `domain` |
| `migrations` | Numbered SQL files, append-only | — |

`src/app.ts` wires everything (composition root); `src/main.ts` starts the HTTP server and seeds the DB.

## Conventions

- Inject `Clock` everywhere time matters; never call `new Date()` inside `domain` or `services`.
- Services take an `Actor` (`{ id, role }`) as the first argument and enforce scoping (owners see only their findings).
- Throw domain errors; `infrastructure/http/errorHandler.ts` maps them to HTTP status codes.
- Every service log line goes through `logger.child({ auditId, findingId })`.
