---
name: control-resolver
description: Resolve which control version applies to a finding or audit scope, and check control-library immutability (AC-01). Use when recording findings, editing the controls library, or computing coverage.
---
# Control resolver

- A control is identified by `(frameworkCode, controlId)`; versions are integers starting at 1.
- Only `PUBLISHED` versions can be referenced by audits and findings. The latest published version wins.
- A published version is immutable: editing means creating version `n+1` as `DRAFT`, then publishing it.
  The DB trigger `control_versions_no_update_published` and the `controls-immutability-check` hook back this.
- Audit scope is a list of control ids within one framework; an empty list means "all published controls".
- Coverage % for a framework = assessed controls ÷ published controls × 100, rounded **down** to an integer
  (integer arithmetic: `Math.floor(assessed * 100 / total)`). "Assessed" = in scope of an audit that has left PLANNED.

Check: `npx vitest run tests/unit/controlVersionPolicy.test.ts tests/api/controls.api.test.ts`
