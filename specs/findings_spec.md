# Findings spec

Status: Approved · Owner agent: remediation-tracker-agent · Skills: control-resolver, sla-evaluator · Sprint 2

## Purpose
Auditors record what they found against a specific control item during an audit, and hand it to an owner with an
SLA-driven due date.

## Actors and permissions
- AUDITOR: record findings on audits in IN_PROGRESS or FINDINGS_RECORDED; read all findings.
- OWNER: read only findings where `owner_id = self` (NFR-04).
- REVIEWER, ADMIN: read all findings.

## Data
`findings(id, finding_id, audit_id, framework_code, control_id, control_version, severity, title, description,
evidence_ref, owner_id, raised_by, detected_on, due_date, sla_rule_set_version, created_at)` — insert-only.
`finding_events(seq, finding_id, from_state, to_state, actor_id, comment, at)` — append-only.

## Rules
1. `finding_id` = `FND-<NNNNN>` unique.
2. The control must be published, belong to the audit's framework and be in the audit's scope.
   `control_version` = current published version at the time of recording (control-resolver).
3. Severity defaults to the control's default severity when omitted; otherwise one of CRITICAL/HIGH/MEDIUM/LOW.
4. Owner must be an active user with role OWNER. The auditor cannot be the owner.
5. `detected_on` = today (clock). `due_date` from the active SLA rule set (see sla-engine spec).
6. `evidence_ref` is the auditor's reference to what they observed (ticket, screenshot id), 1–300 chars.
7. Creation writes the finding and event `null → OPEN` in one transaction.
8. Recording the first finding does not move the audit; the auditor moves it to FINDINGS_RECORDED explicitly.

## API
| Method | Path | Role |
|---|---|---|
| POST | `/api/audits/:auditId/findings` | AUDITOR |
| GET | `/api/findings` (`?state=&severity=&auditId=`) | ADMIN, AUDITOR, REVIEWER (all) · OWNER (own) |
| GET | `/api/findings/:findingId` | ADMIN, AUDITOR, REVIEWER · OWNER (own, else 404) |

## Acceptance Criteria

### AC-04 Record findings
- **Given** an IN_PROGRESS audit in scope of control `CC6.1`, **when** the auditor records a HIGH finding with
  description and evidence reference and owner `olivia.owner`, **then** 201, state OPEN, owner set, due date set,
  `findingId` like `FND-00001`.
- **Given** a PLANNED or CLOSED audit, **when** a finding is recorded, **then** 409.
- **Given** a control outside the audit scope or framework, **then** 400.
- **Given** an owner id that is not an OWNER, **then** 400.
- **Given** severity omitted, **then** the control's default severity is used.
- **Given** owner A, **when** they list findings, **then** they see only findings assigned to A; fetching B's finding → 404.
