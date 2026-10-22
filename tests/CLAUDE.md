# tests/ — test suites

| Folder | Runner | What |
|---|---|---|
| `unit/` | Vitest | Domain rules and services against an in-memory DB |
| `api/` | Vitest + supertest | HTTP contracts, auth boundary, logging |
| `architecture/` | Vitest + dependency-cruiser | Layering, append-only, SoD wiring |
| `e2e/` | Playwright | UI journeys + screenshot snapshots in `e2e/__snapshots__/` |

- Test names start with the tag they prove: `[AC-07]`, `[NFR-03]`. Several tags are fine.
- Use `tests/helpers/fixture.ts` to build an app with a fixed clock and in-memory DB. Never touch `data/`.
- Write the test red first, commit, then generate the code (see `docs/tdd.md`).
