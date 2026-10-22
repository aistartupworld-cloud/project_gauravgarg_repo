# Audit plan & lifecycle spec

Status: Approved · Owner agent: audit-planner-agent · Skill: finding-state-validator · Sprint 1

## Purpose
Auditors plan an audit against one framework and a scope of controls, then drive it through a fixed lifecycle.

## Actors and permissions
- AUDITOR: create audits, transition audits. ADMIN: read all, transition (break-glass). REVIEWER: read.
- OWNER: no access to audit endpoints (sees findings only).

## Data
`audits(id, audit_id, framework_code, title, scope_json, target_end_date, created_by, created_at)` — insert-only.
`audit_events(seq, audit_id, from_state, to_state, actor_id, note, at)` — append-only; current state = latest event.

## Rules
1. `audit_id` = `AUD-<YYYY>-<NNNN>`, sequence per year, unique (unique index).
2. Framework must exist and have ≥1 published control. Scope = list of control ids that are published in that
   framework; empty list = whole framework. Unknown ids → 400.
3. `target_end_date` is an ISO date not before today.
4. Creation writes the audit row and a first event `null → PLANNED` in one transaction.

### Transition table
| From | To |
|---|---|
| PLANNED | IN_PROGRESS |
| IN_PROGRESS | FINDINGS_RECORDED |
| FINDINGS_RECORDED | REMEDIATION_IN_PROGRESS |
| REMEDIATION_IN_PROGRESS | CLOSED |

Every other pair (including same-state, skipping, going back, leaving CLOSED) raises `InvalidAuditStateException`
(HTTP 409, `code: "INVALID_AUDIT_STATE"`).

5. Guards: `IN_PROGRESS → FINDINGS_RECORDED` requires ≥1 finding. `REMEDIATION_IN_PROGRESS → CLOSED` requires all
   findings REMEDIATED. Guard failures also raise `InvalidAuditStateException` with a reason.
6. A CLOSED audit is read-only: no transitions, no new findings (NFR-08).

## API
| Method | Path | Role |
|---|---|---|
| GET | `/api/audits` | ADMIN, AUDITOR, REVIEWER |
| GET | `/api/audits/:auditId` | ADMIN, AUDITOR, REVIEWER |
| POST | `/api/audits` | AUDITOR |
| POST | `/api/audits/:auditId/transition` `{ "to": "IN_PROGRESS" }` | AUDITOR, ADMIN |

## Acceptance Criteria

### AC-02 Create audit plan
- **Given** an auditor and framework `SOC2` with published controls, **when** they POST an audit with title, scope
  `["CC6.1","CC7.2"]` and a future target end date, **then** 201, state PLANNED, and `auditId` matches `AUD-2026-0001`.
- **Given** two audits created in a row, **then** their ids differ (sequence increments).
- **Given** a scope id that is not a published control, **then** 400.
- **Given** a past target end date, **then** 400.
- **Given** an OWNER, **when** they POST an audit, **then** 403.

### AC-03 Enforced lifecycle
- **Given** a PLANNED audit, **when** moved to IN_PROGRESS, **then** state is IN_PROGRESS and an event is appended.
- **Given** a PLANNED audit, **when** moved directly to CLOSED, **then** `InvalidAuditStateException` (409).
- **For every** (from, to) pair not in the table, **then** `InvalidAuditStateException`.
- **Given** an IN_PROGRESS audit with no findings, **when** moved to FINDINGS_RECORDED, **then** 409.
- **Given** an audit with an open finding, **when** moved to CLOSED, **then** 409.
- **Given** a CLOSED audit, **when** any transition or new finding is attempted, **then** 409.
