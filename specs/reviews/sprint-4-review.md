# Sprint 4 review — dashboards, admin console, React UI, Playwright

Reviewer: reviewer agent + design-critic · Contract: `sprint-contracts/sprint-4-dashboard-admin-ui.md`

## Round 1 — verdict: RATCHET

| Check | Result |
|---|---|
| `npm run typecheck` | clean (server, web, tests, configs) |
| `npm test` | 28 files, 294 passed |
| `npm run lint:deps` | no violations — now cruises `server/src` **and** `web/src` (rule `web-not-to-server`) |
| `npm run test:e2e` | 14 passed (desktop 1280×800 + mobile 390×844) |
| Design critique | Finding detail showed the framework twice (`CIS CIS-1.1`); control reference reordered to `CIS-1.1 v1 (CIS)` |

Ratchet item: fix the duplicated framework label, regenerate the affected snapshot.

## Round 2 — verdict: PASS

| Check | Result |
|---|---|
| `npx playwright test` against committed snapshots | 14 passed, 0 diffs |
| Journey (AC-02 → AC-07) | auditor plans `AUD-2026-0004`, records `FND-00006` (HIGH, due 2026-11-21 = +30 days), owner's bad evidence rejected with field errors, valid evidence → AWAITING_REVIEW, reviewer blocked without comment, approval → REMEDIATED, 3 timeline events |
| AC-08 | escalation queue ordered CRITICAL 33d before HIGH 10d; ESCALATED badge only on overdue rows |
| AC-09 | five panels render; numbers match the seeded state (4 open, 2 overdue, 1 critical, 2 high) |
| AC-10 | menus per role; owner typing `#/admin` is redirected home; server still returns 403 (API tests) |
| Responsive | 390 px: sidebar collapses to a top bar with a menu, `scrollWidth − clientWidth = 0`; wide tables scroll inside `.table-wrap` |
| Snapshots | 8 PNGs under `tests/e2e/__snapshots__/`, generated on Linux Chromium with the clock pinned by `FIXED_NOW` |

Honesty note: the reviewer ran Playwright through the test runner in this environment. The Playwright **MCP** server is
configured in `.mcp.json` for interactive evaluator walks but was not invoked in this build session.

Merge approved.
