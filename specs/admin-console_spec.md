# Admin console & roles spec

Status: Approved · Owner agent: implementer (+ security-reviewer) · Sprint 4

## Purpose
Admins manage who can do what and the reference data the rest of the system depends on.

## Data
`users(id, username, display_name, role, active, created_at)`. Role ∈ {ADMIN, AUDITOR, OWNER, REVIEWER}.

## Rules
1. Username `^[a-z][a-z0-9.\-]{2,39}$`, unique. Display name 2–80 chars.
2. Exactly one role per user at a time. Admins may change a user's role (people move teams):
   `PATCH /api/admin/users/:id/role {role}`. Findings already assigned to the user stay assigned, and the role change
   is logged. Separation of duties is checked against **identity**, not current role (see remediation spec rule 5).
3. Access is scoped per role by the permission matrix in `server/src/domain/accessPolicy.ts`:

| Action | ADMIN | AUDITOR | OWNER | REVIEWER |
|---|---|---|---|---|
| users.manage | ✔ | | | |
| controls.manage | ✔ | | | |
| controls.read | ✔ | ✔ | | ✔ |
| sla.manage | ✔ | | | |
| audits.create | | ✔ | | |
| audits.transition | ✔ | ✔ | | |
| audits.read | ✔ | ✔ | | ✔ |
| findings.record | | ✔ | | |
| findings.readAll | ✔ | ✔ | | ✔ |
| findings.readOwn | | | ✔ | |
| evidence.submit | | | ✔ | |
| findings.review | | | | ✔ |
| escalations.read | ✔ | | | |
| dashboard.global | ✔ | ✔ | | ✔ |
| dashboard.own | | | ✔ | |

4. Sign-in: `POST /api/auth/login {username}` → `{ token, user }`. Token = base64url(payload).HMAC-SHA256, expires
   after 8 hours. Unknown or inactive user → 401.

## Admin console UI
Tabs: Users (list + create), Controls library (list by framework, create draft, publish, revise), SLA rules
(history + new version), Escalation queue.

## API
| Method | Path | Role |
|---|---|---|
| POST | `/api/auth/login` | public |
| GET | `/api/auth/me` | any signed-in |
| GET | `/api/admin/users` | ADMIN |
| POST | `/api/admin/users` | ADMIN |
| PATCH | `/api/admin/users/:id/role` | ADMIN |
| GET | `/api/users?role=OWNER` | ADMIN, AUDITOR (to pick owners) |

## Acceptance Criteria

### AC-10 Users, roles and scoped access
- **Given** an admin, **when** they create user `nina.owner` with role OWNER, **then** 201 and she can sign in.
- **Given** a duplicate username or unknown role, **then** 400/409.
- **Given** Olivia (OWNER), **when** an admin changes her role to REVIEWER, **then** her next sign-in carries REVIEWER and
  her assigned findings stay assigned to her.
- **Given** each role, **then** the permission matrix above holds for every action (unit test iterates the matrix).
- **Given** each role's token, **when** calling an endpoint outside its permissions, **then** 403; without a token 401.
- **Given** an admin, **then** they can manage controls (AC-01) and SLA rules (AC-05) from the console.
