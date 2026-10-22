# SLA engine & escalation spec

Status: Approved · Owner agent: escalation-agent · Skill: sla-evaluator · Sprint 2

## Purpose
Turn severity into a due date, keep the rules versioned, and surface breaches.

## Data
`sla_rule_sets(version, critical_days, high_days, medium_days, low_days, created_by, created_at, note)` — append-only.
Active rule set = highest version. Seeded v1 = 7 / 30 / 60 / 90.

## Rules
1. `due_date = addDays(detected_on, days[severity])` using UTC calendar dates and integer day numbers (NFR-01).
2. Each finding stores the `sla_rule_set_version` used; publishing a new rule set never changes existing due dates.
3. Rule set days are integers 1–365 and must be non-increasing with severity
   (CRITICAL ≤ HIGH ≤ MEDIUM ≤ LOW); otherwise 400.
4. Overdue ⇔ `today > due_date` and state ≠ REMEDIATED. Such findings carry `escalated: true` and `daysOverdue`.
5. Escalation queue = all overdue findings, sorted by `daysOverdue` desc, then severity rank.

## API
| Method | Path | Role |
|---|---|---|
| GET | `/api/sla-rules` | any signed-in (active + history) |
| POST | `/api/admin/sla-rules` | ADMIN (creates next version) |
| GET | `/api/admin/escalations` | ADMIN |

## Acceptance Criteria

### AC-05 Severity-based, versioned SLA
- **Given** rule set v1 and detection on 2026-10-01, **then** CRITICAL → 2026-10-08, HIGH → 2026-10-31,
  MEDIUM → 2026-11-30, LOW → 2026-12-30.
- **Given** detection on 2026-02-25 CRITICAL, **then** due 2026-03-04; on 2028-02-25, due 2028-03-03 (leap year).
- **Given** detection 2026-12-20 HIGH, **then** due 2027-01-19.
- **Given** an admin publishes v2 with CRITICAL 3, **then** new findings use v2 and existing findings keep v1 dates.
- **Given** a rule set with 2.5 days or CRITICAL > HIGH, **then** 400.

### AC-08 Escalation
- **Given** a finding due 2026-10-10 in state OPEN and today 2026-10-11, **then** `escalated: true`,
  `daysOverdue: 1`, and it appears in `GET /api/admin/escalations`.
- **Given** today equals the due date, **then** not escalated.
- **Given** a REMEDIATED finding past its due date, **then** not escalated and not in the queue.
- **Given** a non-admin, **when** they call the escalation queue, **then** 403.
