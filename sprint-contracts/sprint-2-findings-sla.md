# Sprint 2 contract — findings + SLA engine

Branch: `feat/sprint-2-findings-sla` · Specs: findings, sla-engine, platform-nfr · Agents: remediation-tracker-agent,
escalation-agent · Skills: sla-evaluator, control-resolver

## Goal
Auditors record findings against in-scope controls; each finding gets an owner and an SLA due date from a versioned
rule set; overdue findings are escalated and queued for the admin.

## In scope
| ID | Deliverable |
|---|---|
| AC-04 | `POST /api/audits/:id/findings`, finding ids `FND-NNNNN`, OPEN with owner + due date; owner-scoped reads |
| AC-05 | `sla_rule_sets` v1 seeded 7/30/60/90; admin publishes v2+; findings pin their version |
| AC-08 | `escalated` + `daysOverdue` on every finding view; `GET /api/admin/escalations` |
| AC-03 (guard) | `IN_PROGRESS → FINDINGS_RECORDED` needs ≥1 finding; `CLOSED` needs all remediated |
| NFR-01 | Integer day arithmetic (`calendar.ts`), architecture test bans float/ms maths in SLA code |
| NFR-02 | Append-only triggers on `findings`, `finding_events`, `sla_rule_sets` |

## TDD plan (worked example for docs/tdd.md)
1. Commit `slaPolicy.ts` with signatures only (`throw new Error('not implemented')`) and the AC-05 edge-case tests
   from the sla-evaluator skill. Run: tests fail on assertions/not-implemented (red).
2. Implement `computeDueDate` on day numbers. Run green.
3. Refactor: move date helpers to `calendar.ts`, keep tests green.

## Out of scope
Evidence, review decisions (sprint 3); dashboards/UI (sprint 4).

## Evaluator checklist
- [ ] `npm run typecheck`, `npm test`, `npm run lint:deps` green
- [ ] `npm run migrations:lock` adds 003/004 only; 001/002 checksums unchanged
- [ ] Owner A cannot read owner B's finding (404)
- [ ] `GET /api/admin/escalations` returns overdue findings sorted by days overdue
