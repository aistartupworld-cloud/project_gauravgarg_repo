# Sprint 4 contract — dashboards, admin console, React UI, Playwright

Branch: `feat/sprint-4-dashboard-admin-ui` · Specs: dashboards, admin-console, app_spec §2 (workbenches)
Agents: ui-designer → implementer → design-critic → reviewer (Playwright MCP) · Skill: control-resolver (coverage)

## Goal
Compute the compliance dashboard and ship the React UI: Dashboard, Auditor / Owner / Reviewer workbenches and the
Admin console, responsive down to 390 px, validated with Playwright including screenshot snapshots.

## In scope
| ID | Deliverable |
|---|---|
| AC-09 | `GET /api/dashboard` (5 panels), `GET /api/dashboard/me` (owner) — pure aggregation in `domain/dashboardAggregator.ts` |
| AC-10 | Admin console UI: users (create, change role), controls (draft/publish/revise), SLA rules, escalation queue |
| UI | Workbenches for every role; one responsive layout (sidebar ≥ 768 px, top bar below) |
| E2E | `tests/e2e/*.spec.ts` with `toHaveScreenshot` snapshots committed under `tests/e2e/__snapshots__/` |

## Determinism for snapshots
`FIXED_NOW` env var pins the server clock; Playwright starts the server on a fresh DB with `FIXED_NOW=2026-10-22T09:00:00Z`.

## Evaluator checklist
- [ ] `npm test`, `npm run typecheck`, `npm run lint:deps` green
- [ ] `npm run test:e2e` green with snapshots
- [ ] Reviewer walks: auditor records finding → owner submits evidence → reviewer approves, at 1280 px and 390 px
