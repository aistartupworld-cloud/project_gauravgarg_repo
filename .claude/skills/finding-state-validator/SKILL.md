---
name: finding-state-validator
description: Validate audit and finding state machines against the spec transition tables (AC-03, AC-06, AC-07). Use before merging any change to a transition table or a service method that changes state.
---
# Finding / audit state validator

## Spec tables
Audit: PLANNED→IN_PROGRESS→FINDINGS_RECORDED→REMEDIATION_IN_PROGRESS→CLOSED (linear, no skips, no back-moves).
Finding: OPEN→AWAITING_REVIEW; AWAITING_REVIEW→REMEDIATED | RE_OPEN; RE_OPEN→AWAITING_REVIEW. REMEDIATED is terminal.

## Procedure
1. Read `AUDIT_TRANSITIONS` and `FINDING_TRANSITIONS` in `server/src/domain/`.
2. Build the full matrix of `from × to` and mark allowed pairs from the tables above.
3. Every disallowed pair must throw (`InvalidAuditStateException` / `InvalidFindingStateException`).
   The unit tests iterate the matrix; run `npx vitest run tests/unit/auditStateMachine.test.ts tests/unit/findingStateMachine.test.ts`.
4. Confirm each service method that writes a state goes through `assertAuditTransition` / `assertFindingTransition`
   (grep for `appendEvent(` in `server/src/services`).
