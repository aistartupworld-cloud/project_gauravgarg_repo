# Dashboards & reports spec

Status: Approved · Owner agent: escalation-agent · Skill: control-resolver · Sprint 4

## Purpose
One screen that tells a compliance lead where they stand.

## Actors
ADMIN, AUDITOR, REVIEWER see the global dashboard. OWNER sees a personal summary (their findings only).

## Metrics (all computed from current state, integer arithmetic)
1. **Control coverage %** per framework = `floor(assessed × 100 / published)`, where assessed = distinct published
   controls in scope of at least one audit that has left PLANNED. 0 published → 0 %.
2. **Open findings by severity** = count of findings not REMEDIATED, grouped CRITICAL/HIGH/MEDIUM/LOW (all four
   keys always present).
3. **Overdue items by owner** = for each owner with ≥1 overdue finding: owner name, count, max days overdue; sorted
   by count desc.
4. **Audit progress** = per audit: id, title, state, stage index (1–5), `progressPct = floor((stage−1) × 100 / 4)`,
   findings total / remediated.
5. **Per-framework summary** = framework, published controls, coverage %, audits (by state), open findings,
   overdue findings.

## API
| Method | Path | Role |
|---|---|---|
| GET | `/api/dashboard` | ADMIN, AUDITOR, REVIEWER |
| GET | `/api/dashboard/me` | OWNER |

## Acceptance Criteria

### AC-09 Compliance dashboard
- **Given** SOC2 with 4 published controls and one IN_PROGRESS audit scoped to 2 of them, **then** SOC2 coverage is 50.
- **Given** a PLANNED audit only, **then** coverage 0.
- **Given** findings HIGH (open), HIGH (remediated), CRITICAL (open), **then** open by severity is
  `{CRITICAL:1, HIGH:1, MEDIUM:0, LOW:0}`.
- **Given** two overdue findings for Olivia and one for Omar, **then** overdue by owner lists Olivia (2) before Omar (1).
- **Given** an audit in FINDINGS_RECORDED, **then** its progress is 50 %.
- **Given** an OWNER, **when** they call `/api/dashboard`, **then** 403, and `/api/dashboard/me` shows only their findings.
- The UI renders all five panels and stays usable at 390 px width.
