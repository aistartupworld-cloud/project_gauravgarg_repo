# server/src/domain — business rules

- Pure functions and plain types. **No** imports from `services`, `repositories`, `controllers`, `infrastructure`,
  `express` or `node:*`. `tests/architecture/layering.test.ts` fails the build otherwise.
- One rule family per file (`auditStateMachine.ts`, `findingStateMachine.ts`, `slaPolicy.ts`,
  `separationOfDuties.ts`, `controlVersionPolicy.ts`, `accessPolicy.ts`, `evidencePolicy.ts`, `dashboardAggregator.ts`).
- Transition tables are data (`const AUDIT_TRANSITIONS = {...}`) so `state-machine-validator-agent` can diff them
  against the spec tables.
- Dates are ISO `YYYY-MM-DD` strings. Use `addDays` / `daysBetween` from `calendar.ts`; they work on integer day
  numbers, never on fractional milliseconds (NFR-01).
- Every exported rule has a unit test tagged with its AC/NFR id.
