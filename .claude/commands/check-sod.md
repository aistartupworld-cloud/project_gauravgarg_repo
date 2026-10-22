---
description: Prove separation of duties holds — owners and raising auditors cannot approve a remediation.
---
1. Grep `server/src` for every place that writes `REMEDIATED`:
   `grep -rn "REMEDIATED" server/src/services server/src/repositories`.
2. For each, confirm `assertSeparationOfDuties(` is called earlier in the same function.
3. Run `npx vitest run tests/unit/separationOfDuties.test.ts tests/api/remediation.api.test.ts tests/architecture/sod-wiring.test.ts`.
4. Report PASS with the list of call sites, or FAIL with file:line of the unguarded path.
