# Test-driven development in SecureGate

Every sprint followed the same loop, recorded in git history as separate commits:

1. **Spec.** The acceptance criterion is written (or changed) in `specs/*_spec.md` with Given/When/Then.
2. **Red.** The `tester` agent writes tests tagged with the criterion id (`[AC-05]`, `[NFR-01]`) and commits them with
   the production module reduced to signatures that throw `not implemented`.
3. **Green.** The `implementer` agent writes the smallest code that passes, without touching the tests.
4. **Refactor + review.** The `reviewer` agent runs the sprint contract's checklist; RATCHET or FAIL sends it back.
5. **Trace.** `npm run ac:trace` fails CI if any criterion in `specs/` has no tagged test.

| Sprint | Red commit | Green commit(s) |
|---|---|---|
| 1 | `0aa8e43` failing AC-01/02/03/10 + NFR-02..08 | `b2ad653` |
| 2 | `011f68b` failing AC-04/05/08 + NFR-01/02 | `2c841e6` (SLA policy), `c184dd5` (findings, SLA API) |
| 3 | `0303445` failing AC-06/07/10 role change | `afb6a69`, then fix loop `5760198` |
| 4 | `bceb5ff` failing AC-09 dashboard | `c163081`, UI + Playwright on the same branch |

## Worked example — AC-05 due dates across a leap day

**Spec** (`specs/sla-engine_spec.md`, AC-05): the due date is the detection date plus the severity's days from the
active SLA rule set (CRITICAL 7, HIGH 30, MEDIUM 60, LOW 90), counted in whole calendar days (NFR-01).

The `sla-evaluator` skill lists the edge cases a calendar implementation usually gets wrong. The tester turned each
into a row:

```ts
// tests/unit/slaPolicy.test.ts
it.each([
  ['2026-02-25', 'CRITICAL', '2026-03-04', 'crosses February in a non-leap year'],
  ['2028-02-25', 'CRITICAL', '2028-03-03', 'crosses February 29 in a leap year'],
  ['2026-12-20', 'HIGH', '2027-01-19', 'crosses the year boundary'],
  ['2026-03-28', 'CRITICAL', '2026-04-04', 'ignores DST: dates are UTC calendar days'],
  ['2100-02-25', 'CRITICAL', '2100-03-04', '2100 is not a leap year'],
  ['2000-02-25', 'CRITICAL', '2000-03-03', '2000 is a leap year'],
] as const)('[AC-05][NFR-01] %s %s → %s (%s)', (detected, severity, due, _why) => {
  expect(computeDueDate(detected, severity, v1)).toBe(due);
});
```

**Red** — commit `011f68b`, where `computeDueDate` was only a signature:

```ts
export function computeDueDate(_detectedOn: string, _severity: Severity, _ruleSet: SlaRuleSet): string {
  throw new Error('not implemented');
}
```

```text
$ npx vitest run tests/unit/slaPolicy.test.ts      # at 011f68b (replayed in a worktree)
 × [AC-05][NFR-01] 2026-02-25 CRITICAL → 2026-03-04 (crosses February in a non-leap year)
 × [AC-05][NFR-01] 2028-02-25 CRITICAL → 2028-03-03 (crosses February 29 in a leap year)
 × [AC-05][NFR-01] 2100-02-25 CRITICAL → 2100-03-04 (2100 is not a leap year)
 × [AC-05][NFR-01] 2000-02-25 CRITICAL → 2000-03-03 (2000 is a leap year)
   → expected Error: not implemented to be an instance of ValidationError
 Test Files  1 failed (1)
      Tests  24 failed | 1 passed (25)
```

**Green** — commit `2c841e6`. The implementer reused the integer day-number calendar from `domain/calendar.ts`
rather than `Date#setDate`, which the `integerArithmetic` architecture test forbids in the domain:

```ts
export function computeDueDate(detectedOn: string, severity: Severity, ruleSet: SlaRuleSet): string {
  return addDays(detectedOn, ruleSet.days[severity]);
}
```

```text
$ npx vitest run tests/unit/slaPolicy.test.ts
 Test Files  1 passed (1)
      Tests  25 passed (25)
```

The same rule is then proven end to end: the API test records a HIGH finding on 2026-10-01 and expects 2026-10-31,
and the Playwright journey records a HIGH finding at the pinned date 2026-10-22 and reads `2026-11-21` on screen.

## Test inventory

| Suite | Path | Count | Runs with |
|---|---|---|---|
| Unit (pure domain) | `tests/unit` | 11 files | `npm run test:unit` |
| API (supertest, in-memory DB) | `tests/api` | 11 files | `npm run test:api` |
| Architecture (structure, hooks, migrations) | `tests/architecture` | 6 files | `npm run test:arch` (+ dependency-cruiser) |
| End to end (Playwright, desktop + 390 px) | `tests/e2e` | 5 files, 14 tests, 8 snapshots | `npm run test:e2e` |

Vitest: 294 tests. Coverage of `server/src` (committed in `coverage/`): 97.9 % lines, 90.8 % branches,
92.9 % functions; thresholds in `vitest.config.ts` fail the build below 85 / 75 / 85.
