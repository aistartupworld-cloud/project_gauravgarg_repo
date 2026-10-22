# Sprint 2 review — findings + SLA engine

Reviewer: reviewer agent · Contract: `sprint-contracts/sprint-2-findings-sla.md`

## Round 1 — verdict: RATCHET

| Check | Result |
|---|---|
| `npm run typecheck` | **1 error**: `tests/unit/slaPolicy.test.ts` — `it.each` rows have 4 elements, callback declared 3 parameters |
| `npm test` | **1 failed / 216 passed** |
| `npm run lint:deps` | no violations (51 modules) |
| `migrations:lock` | locked 003, 004 only; 001/002 checksums unchanged |

Defects:
1. `[AC-08] overdue findings are flagged and queued … most overdue first` — `q2.body.map is not a function`.
   Root cause: the test moved the clock 21 days forward and re-used a bearer token issued at the earlier time;
   tokens expire after 8 h, so the API correctly answered 401. **The code is right; the test environment was wrong.**
   Fix in the environment: `tests/helpers/fixture.ts` now caches tokens per clock hour so time-travel tests
   re-authenticate. Deposited in `docs/knowledge-deposits.md` (KD-03).
2. Type error in the edge-case table: callback must accept the 4th `why` column.

## Round 2 — verdict: PASS

| Check | Result |
|---|---|
| `npm run typecheck` | clean |
| `npm test` | 18 files, 217 tests passed |
| Owner A reading owner B's finding | 404 (`[NFR-04][AC-04] owners only see findings assigned to them`) |
| Escalation queue | seeded DB: `FND-00001 CRITICAL olivia.owner 33 days`, `FND-00002 HIGH omar.owner 10 days`, sorted by days overdue |
| Log masking on seed | seeded description containing `admin-portal.example.internal (10.20.4.17)` never appears in logs (descriptions are not logged; masking covers any that are) |

TDD evidence: commit `test(sprint-2)` (red, 44 failing incl. `Error: not implemented` for the leap-year cases),
then `feat(sla)` (green). Merge approved.
