# Sprint 0 review — substrate

Reviewer: reviewer agent · Contract: `sprint-contracts/sprint-0-substrate.md`

## Round 1 — verdict: RATCHET

| Check | Result |
|---|---|
| Specs have `## Acceptance Criteria` | 8/9 — **`specs/app_spec.md` had "Global acceptance criteria" heading, not the required section name** |
| AC trace lists 18 criteria, exits 1 | 18 listed, 18 MISS, exit 1 (expected: no tests yet) |
| Hooks block bad payloads | `role-boundary-check` blocked `router.get("/x", handler)` (exit 2); `sod-guard` blocked a services edit setting `'REMEDIATED'` without the SoD call (exit 2); `finding-immutability-check` blocked `UPDATE findings` in a repository (exit 2) |
| `plugin.json` paths exist | all 14 agents, skills, commands, 6 hook scripts, `.mcp.json` resolve |
| `.mcp.json` | parses, server `playwright` |

Ratchet item: rename the app spec section to `## 4. Acceptance Criteria (global, from the brief)` so the
"explicit Acceptance Criteria section" rule holds for the root spec too.

## Round 2 — verdict: PASS

Heading fixed in `specs/app_spec.md`. All checklist items green. Merge approved.
