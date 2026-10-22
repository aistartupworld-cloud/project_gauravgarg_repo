# server/src/controllers — HTTP + auth boundary (NFR-04)

- Every route declares its roles inline: `router.post('/audits', requireRole('AUDITOR'), handler)`.
  The `role-boundary-check` hook rejects a route line without `requireRole(` or `authenticated` marker.
- Validate bodies with the helpers in `infrastructure/http/validate.ts`; return 400 on bad input.
- Controllers never import repositories or the DB.
- Set `res.locals.logContext` with `auditId` / `findingId` so the request log line carries them (NFR-06).
