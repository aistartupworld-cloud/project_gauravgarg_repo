# Controls library spec

Status: Approved · Owner agent: audit-planner-agent · Skill: control-resolver · Sprint 1

## Purpose
Hold the catalogue of controls per framework that audits and findings refer to, with versioning so that history
never changes underneath a finding.

## Actors and permissions
- ADMIN: create drafts, publish, create a new version of a published control.
- AUDITOR, REVIEWER: read published controls. OWNER: read controls referenced by their findings (via the finding).

## Data
`control_versions(id, framework_code, control_id, version, title, description, category, default_severity,
status DRAFT|PUBLISHED, created_by, created_at, published_at)` — unique `(framework_code, control_id, version)`.
Frameworks: `ISO27001`, `SOC2`, `CIS` (seeded); admins may add more.

## Rules
1. `control_id` matches `^[A-Za-z0-9][A-Za-z0-9.\-]{0,31}$`; title 3–200 chars; description 1–2000 chars;
   category 2–80 chars; default severity ∈ {CRITICAL, HIGH, MEDIUM, LOW}.
2. A new control starts as version 1 `DRAFT`. Drafts may be edited by an admin.
3. Publishing sets `status=PUBLISHED`, `published_at`. A published row can never change (DB trigger + service check);
   attempts raise `ImmutableRecordError` (HTTP 409).
4. Revising a published control creates version `n+1` as `DRAFT`. Only one open draft per control.
5. "Current" control = highest published version.

## API
| Method | Path | Role |
|---|---|---|
| GET | `/api/frameworks` | any signed-in |
| GET | `/api/controls?framework=ISO27001` | ADMIN, AUDITOR, REVIEWER |
| POST | `/api/admin/controls` | ADMIN |
| PATCH | `/api/admin/controls/:id` (draft only) | ADMIN |
| POST | `/api/admin/controls/:id/publish` | ADMIN |
| POST | `/api/admin/controls/:id/revise` | ADMIN |

## Acceptance Criteria

### AC-01 Controls library with immutable published versions
- **Given** an admin, **when** they create control `A.5.1` in `ISO27001` with description, category and default
  severity HIGH, **then** it is stored as version 1 DRAFT.
- **Given** a DRAFT, **when** the admin publishes it, **then** status is PUBLISHED and it appears in `GET /api/controls`.
- **Given** a PUBLISHED version, **when** anyone tries to edit it (API or SQL), **then** the change is rejected
  (409 / trigger abort) and the stored row is unchanged.
- **Given** a PUBLISHED version 1, **when** the admin revises it, **then** version 2 DRAFT exists and version 1 is untouched.
- **Given** invalid input (bad id, unknown severity), **then** 400 with a field message.
- **Given** a non-admin, **when** they POST a control, **then** 403.
