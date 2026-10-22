# Sprint 1 contract — controls library + audit plan

Branch: `feat/sprint-1-controls-audit` · Specs: controls-library, audit-plan, admin-console (auth + matrix), platform-nfr

## Goal
First vertical slice: an admin publishes controls, an auditor plans an audit against them and drives its
lifecycle. Brings up the platform skeleton (DB + migrations, auth boundary, JSON logging, health).

## In scope
| ID | Deliverable |
|---|---|
| AC-01 | Control drafts, publish, revise; published rows immutable (service + trigger) |
| AC-02 | Create audit with framework, scope, target end date; `AUD-YYYY-NNNN` ids |
| AC-03 | Audit transition table + guards; `InvalidAuditStateException` |
| AC-10 (part) | Sign-in, tokens, permission matrix, `requireRole` on every route |
| NFR-02 (part) | Append-only triggers on `audits`, `audit_events` |
| NFR-03, NFR-06 | Masking logger with correlation ids |
| NFR-04 | Auth boundary at controllers |
| NFR-05 | Migration checksums + lock file |
| NFR-07 | `/health` |

## Out of scope
Findings, SLA, remediation, dashboards, UI (sprints 2–4). `IN_PROGRESS → FINDINGS_RECORDED` guard is implemented
against a findings count of 0 until sprint 2 adds findings.

## Files expected
`server/migrations/001_*.sql`, `002_*.sql`; `server/src/{domain,infrastructure,repositories,services,controllers}/*`;
`server/src/app.ts`, `server/src/main.ts`; tests under `tests/unit`, `tests/api`, `tests/architecture`.

## Tests that must exist (tester writes them first, red)
- `tests/unit/auditStateMachine.test.ts` `[AC-03]` iterates the 6×6 matrix (incl. null start)
- `tests/unit/controlVersionPolicy.test.ts` `[AC-01]`
- `tests/unit/accessPolicy.test.ts` `[AC-10]` iterates the role × action matrix
- `tests/unit/auditPolicy.test.ts` `[AC-02]`
- `tests/unit/mask.test.ts` `[NFR-03]`
- `tests/api/controls.api.test.ts` `[AC-01]`, `tests/api/audits.api.test.ts` `[AC-02]` `[AC-03]`
- `tests/api/auth.api.test.ts` `[NFR-04]` `[AC-10]`, `tests/api/logging.test.ts` `[NFR-06]` `[NFR-03]`
- `tests/api/health.test.ts` `[NFR-07]`
- `tests/architecture/layering.test.ts` `[NFR-08]`, `tests/architecture/migrations.test.ts` `[NFR-05]`,
  `tests/architecture/appendOnly.test.ts` `[NFR-02]`

## Evaluator checklist
- [ ] `npm run typecheck` clean
- [ ] `npm test` green
- [ ] `npm run lint:deps` no violations
- [ ] `curl /health` 200 after `npm start`
- [ ] Manual: an OWNER token gets 403 on `POST /api/audits`
