# server/src/services — use cases

- One service per aggregate: `ControlService`, `SlaService`, `AuditService`, `FindingService`, `DashboardService`,
  `UserService`.
- Signature: `method(actor: Actor, input)`. Check permission with `accessPolicy.assertCan(actor, action)` first.
- Wrap multi-statement writes in `db.transaction(() => ...)`.
- Any method that moves a finding to `REMEDIATED` must call `assertSeparationOfDuties` before writing.
  The `sod-guard` hook blocks edits that don't.
- Never build SQL here; call a repository.
