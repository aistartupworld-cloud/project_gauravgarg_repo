# SecureGate — application spec (root)

Status: Approved · Business case: BC-AINE-015 · Domain: Security & Compliance — Enterprise GRC

## 1. Purpose

SecureGate lets an enterprise plan compliance audits against control frameworks (ISO 27001, SOC 2, CIS),
record findings against controls, assign remediation owners with SLA-driven due dates, collect evidence,
review remediations under separation of duties, and report compliance posture. See `docs/business-case.md`.

## 2. Actors

| Role | Can |
|---|---|
| ADMIN | Manage users and roles, controls library, SLA rule sets; see escalation queue and all data |
| AUDITOR | Plan audits, move audit lifecycle, record findings, see dashboards |
| OWNER | See only findings assigned to them, upload evidence, submit for review |
| REVIEWER | Review submitted remediations: REMEDIATED or RE_OPEN with comment; see dashboards |

## 3. Feature specs

| Feature | Spec | ACs | Sprint |
|---|---|---|---|
| Controls library | [controls-library_spec.md](controls-library_spec.md) | AC-01 | 1 |
| Audit plan & lifecycle | [audit-plan_spec.md](audit-plan_spec.md) | AC-02, AC-03 | 1 |
| Findings | [findings_spec.md](findings_spec.md) | AC-04 | 2 |
| SLA engine & escalation | [sla-engine_spec.md](sla-engine_spec.md) | AC-05, AC-08 | 2 |
| Remediation workflow | [remediation-workflow_spec.md](remediation-workflow_spec.md) | AC-06, AC-07 | 3 |
| Dashboards & reports | [dashboards_spec.md](dashboards_spec.md) | AC-09 | 4 |
| Admin console & roles | [admin-console_spec.md](admin-console_spec.md) | AC-10 | 4 |
| Platform NFRs | [platform-nfr_spec.md](platform-nfr_spec.md) | NFR-01 … NFR-08 | all |

## 4. Acceptance Criteria (global, from the brief)

| ID | Criterion |
|---|---|
| AC-01 | Admin configures a controls library per framework with control_id, description, category, default severity; published control versions are immutable |
| AC-02 | Auditor creates an audit plan with framework, scope, target end date; audit enters PLANNED with a unique audit_id |
| AC-03 | Audit lifecycle PLANNED → IN_PROGRESS → FINDINGS_RECORDED → REMEDIATION_IN_PROGRESS → CLOSED is enforced; invalid transitions raise InvalidAuditStateException |
| AC-04 | Auditor records findings against control items with severity, description, evidence reference; each finding enters OPEN with owner and due date |
| AC-05 | Due date is computed from versioned severity-based SLA rules (CRITICAL 7, HIGH 30, MEDIUM 60, LOW 90 days by default) |
| AC-06 | Owner uploads remediation evidence (stubbed file metadata) and moves the finding to AWAITING_REVIEW |
| AC-07 | Reviewer marks a finding REMEDIATED or RE_OPEN with a comment; the transition is append-only and audited |
| AC-08 | Overdue findings (now > due date) carry an ESCALATED indicator and appear in the admin escalation queue |
| AC-09 | Dashboard shows control coverage %, open findings by severity, overdue items by owner, audit progress, per-framework summary |
| AC-10 | Admin configures controls library and SLA rules; users (AUDITOR/OWNER/REVIEWER/ADMIN) are created with a role; each role has scoped access |

Every AC has at least one test whose name contains its id (`npm run ac:trace`).

## 5. System shape

- Single deployable: `npm start` builds the React UI and starts an Express server on port 3000 that serves the UI
  and `/api/*`. SQLite file in `data/securegate.db`, created and seeded (synthetic data) on first start.
- Authentication: synthetic sign-in by username (no passwords — demo scope) returns an HMAC-signed bearer token
  carrying user id and role. Authorisation is enforced at the controller layer.
- Health: `GET /health` → `200 {"status":"ok"}`.

## 6. Out of scope (from the brief)

Real scanner/SIEM integration, real secrets management, real certification, real evidence storage (metadata only),
live GRC vendor integration, production deployment / multi-region.
