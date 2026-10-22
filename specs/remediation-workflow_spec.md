# Remediation workflow spec

Status: Approved · Owner agent: remediation-tracker-agent · Skills: evidence-validator, finding-state-validator · Sprint 3

## Purpose
Owners prove they fixed a finding; an independent reviewer accepts or rejects the proof.

## Data
`evidence(id, evidence_id, finding_id, file_name, content_type, size_bytes, sha256, note, storage_ref, uploaded_by, uploaded_at)` — append-only.
Decisions are `finding_events` rows with `to_state` REMEDIATED or RE_OPEN and a mandatory comment.

## Finding transition table
| From | To | Who |
|---|---|---|
| OPEN | AWAITING_REVIEW | owner, with evidence |
| RE_OPEN | AWAITING_REVIEW | owner, with new evidence |
| AWAITING_REVIEW | REMEDIATED | reviewer, comment, separation of duties |
| AWAITING_REVIEW | RE_OPEN | reviewer, comment |

Every other pair raises `InvalidFindingStateException` (409, `code: "INVALID_FINDING_STATE"`). REMEDIATED is terminal.

## Rules
1. Evidence metadata rules: see `.claude/skills/evidence-validator/SKILL.md` (file name, content type allow-list,
   size 1 B–25 MiB, sha256 hex).
2. Only the assigned owner can submit evidence for a finding (others → 404 for owners, 403 for other roles).
3. Evidence insert + transition to AWAITING_REVIEW happen in one transaction.
4. Reviewer decisions require a comment of 3–1000 chars.
5. **Separation of duties (NFR-08):** a decision is rejected with `SeparationOfDutiesViolation` (403,
   `code: "SOD_VIOLATION"`) when the deciding user is the finding's owner or the auditor who raised it, or does not
   hold REVIEWER role. ADMIN cannot approve either (admins configure, they don't attest).
6. Audit coupling: when the first finding of an audit in FINDINGS_RECORDED moves to AWAITING_REVIEW, the audit is
   **not** auto-transitioned; auditors move audits explicitly.
7. Findings of a CLOSED audit cannot change (cannot happen by rule 5 of audit spec, still guarded).

## API
| Method | Path | Role |
|---|---|---|
| POST | `/api/findings/:findingId/evidence` | OWNER |
| POST | `/api/findings/:findingId/review` `{ "decision": "REMEDIATED"|"RE_OPEN", "comment": "..." }` | REVIEWER |
| GET | `/api/reviews/queue` | REVIEWER |

## Acceptance Criteria

### AC-06 Evidence and submit for review
- **Given** an OPEN finding owned by Olivia, **when** Olivia uploads valid evidence metadata, **then** 201, the
  finding is AWAITING_REVIEW, and the evidence has `storageRef` `stub://evidence/...`.
- **Given** a RE_OPEN finding, **when** the owner uploads new evidence, **then** AWAITING_REVIEW again.
- **Given** evidence with a disallowed content type or a 30 MiB size, **then** 400 and the state is unchanged.
- **Given** Omar (another owner), **when** he uploads for Olivia's finding, **then** 404.
- **Given** an AWAITING_REVIEW finding, **when** evidence is uploaded again, **then** 409.

### AC-07 Review decision, append-only and audited
- **Given** an AWAITING_REVIEW finding, **when** reviewer Rhea marks it REMEDIATED with a comment, **then** state is
  REMEDIATED and a new event row records actor, comment and time; earlier events are unchanged.
- **Given** an AWAITING_REVIEW finding, **when** Rhea sends RE_OPEN with a comment, **then** RE_OPEN.
- **Given** an empty comment, **then** 400.
- **Given** a REMEDIATED finding, **when** any decision is sent, **then** 409.
- **Given** the event history, **when** anyone tries to UPDATE or DELETE an event row, **then** the DB aborts.

### NFR-08 Separation of duties (also in platform spec)
- **Given** a user who is both the owner and holds REVIEWER role (or the raising auditor), **when** they approve,
  **then** 403 `SOD_VIOLATION`.
