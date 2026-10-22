# Sprint 3 contract — remediation workflow + separation of duties

Branch: `feat/sprint-3-remediation-sod` · Specs: remediation-workflow, admin-console (role change), platform-nfr
Agents: remediation-tracker-agent, state-machine-validator-agent · Skills: evidence-validator, finding-state-validator

## Goal
Owners submit evidence; reviewers decide REMEDIATED / RE_OPEN with a comment; every decision is appended and
separation of duties holds even when people change roles.

## In scope
| ID | Deliverable |
|---|---|
| AC-06 | `POST /api/findings/:id/evidence` (metadata stub, `stub://evidence/...`), OPEN/RE_OPEN → AWAITING_REVIEW |
| AC-07 | `POST /api/findings/:id/review`, `GET /api/reviews/queue`; comment mandatory; append-only events |
| AC-10 | `PATCH /api/admin/users/:id/role` (spec change in this sprint) |
| NFR-02 | `evidence` table append-only (migration 005) |
| NFR-08 | SoD: owner, raising auditor and evidence uploaders cannot approve; checked by user id |

## Order of work
1. tester: AC-06 / AC-07 tests (red). 2. implementer: green. 3. reviewer: run NFR-08 scenarios incl. role change.
4. Any reviewer failure → fix loop recorded in `docs/fix-loops/`.

## Evaluator checklist
- [ ] `npm run typecheck`, `npm test`, `npm run lint:deps` green
- [ ] `/check-sod` passes: every path writing REMEDIATED calls `assertSeparationOfDuties`
- [ ] Finding state matrix fully tested (state-machine-validator-agent)
