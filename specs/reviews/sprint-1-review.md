# Sprint 1 review — controls library + audit plan

Reviewer: reviewer agent · Contract: `sprint-contracts/sprint-1-controls-audit.md`

## Round 1 — verdict: RATCHET

| Check | Result |
|---|---|
| `npm run typecheck` | clean |
| `npm test` | **2 failed / 163 passed** |
| `npm run lint:deps` | no violations (43 modules); seeded violation (controller → repository) correctly reported, then reverted |
| `/health` after start | `{"status":"ok"}` |
| OWNER `POST /api/audits` | 403 |

Defects:
1. `[NFR-03] masks "peer fe80::1ff:fe23:4567:890a dropped"` — got `peer [ip][ip] dropped`. The IPv6 pattern
   split a compressed address into two matches. Ratchet: one match per address; must not mask clock times.
2. `[AC-10] rejects duplicates and unknown roles` — expected fields `role, username`, got `displayName` too.
   The test sent display name `"X"` (1 char) but the spec requires 2–80 chars. **Spec wins: fix the test, not the code.**

Hook note: `controls-immutability-check.sh` as first written blocked *any* `UPDATE control_versions`, which would
also block legitimate DRAFT edits that AC-01 requires. Fixed in the environment (hook now requires the statement to
pin `status = 'DRAFT'`), recorded in `docs/knowledge-deposits.md`.

## Round 2 — verdict: PASS

| Check | Result |
|---|---|
| `npm test` | 13 files, 166 tests passed |
| New guard test | `[NFR-03] clock times and ISO instants survive` added and green |
| AC trace (sprint scope) | AC-01, AC-02, AC-03, AC-10, NFR-02..NFR-08 each have ≥1 tagged test |

Merge approved.
