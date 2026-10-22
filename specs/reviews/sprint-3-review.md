# Sprint 3 review — remediation workflow + separation of duties

Reviewer: reviewer agent · Contract: `sprint-contracts/sprint-3-remediation-sod.md`

## Round 1 — verdict: FAIL

| Check | Result |
|---|---|
| `npm run typecheck` | clean |
| `npm test` | 21 files, 260 passed |
| `npm run lint:deps` | no violations |
| `/check-sod` | **FAIL** — no `assertSeparationOfDuties(` call anywhere in `server/src` |
| NFR-08 scenarios (new `tests/api/separationOfDuties.api.test.ts`) | **3 failed / 1 passed**: owner-turned-reviewer approval returned 200; raising-auditor-turned-reviewer returned 200 |
| `sod-guard.sh` fed the service file | exit 0 — hook did not recognise `toState: decision` |

Blocking defect: separation of duties not enforced (NFR-08). Opened fix loop 001.
Environment defect: project hooks were not loaded in the build session (PM-001).

## Round 2 — verdict: PASS

| Check | Result |
|---|---|
| `npm test` | 26 files, 283 passed |
| `/check-sod` | `remediationService.ts` calls `assertSeparationOfDuties` before `appendEvent` (sodWiring test green) |
| Mutation: remove the SoD call | 4 tests fail (3 API + sodWiring) — rule guarded twice |
| Hook regression | `hooks.test.ts`: sod-guard blocks the original leaky code (exit 2) |
| State matrix | 16 finding pairs enumerated in `findingStateMachine.test.ts`, 4 allowed |
| Seed | `seed.test.ts` green; seeded DB shows OPEN, RE_OPEN, AWAITING_REVIEW, OPEN, REMEDIATED |

Merge approved.
