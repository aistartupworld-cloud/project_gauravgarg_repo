# Platform non-functional requirements spec

Status: Approved · Owner agents: security-reviewer, archtest-author-agent · All sprints

## Acceptance Criteria

### NFR-01 Integer SLA arithmetic
- Dates are ISO `YYYY-MM-DD`. `calendar.ts` converts to an integer day number (days since 1970-01-01, via
  `Date.UTC` of whole components) and back. No float math or millisecond division appears in `server/src/domain`
  (architecture test greps for `86400000`, `/ 864e5`, `parseFloat`, `Math.round(` in SLA code).
- Inputs that are not whole days are rejected.

### NFR-02 Append-only records
- `audits`, `audit_events`, `findings`, `finding_events`, `evidence`, `sla_rule_sets` have `BEFORE UPDATE` and
  `BEFORE DELETE` triggers that `RAISE(ABORT, 'append-only')`. Tests attempt both and expect failure.
- Repositories for these tables expose no update/delete methods (architecture test).

### NFR-03 Masking in logs
- Before a log line is written, string values are masked: IPv4/IPv6 → `[ip]`, hostnames ending in a domain
  (`*.example.internal`, `*.corp`, FQDNs) → `[host]`, credential refs (`password=…`, `secret=…`, `token=…`,
  `vault:…`, `arn:aws:secretsmanager…`) → `[credential]`, asset ids `ASSET-1234` → `[asset]`.
- Masking applies to nested objects and arrays.

### NFR-04 Auth boundary at controller layer
- Every non-public route has `requireRole(...)` on its declaration line (hook + architecture test).
- Owners only see findings assigned to them (API test). Missing token → 401, wrong role → 403.

### NFR-05 Append-only migrations
- Migration files are checksummed in `server/migrations/migrations.lock.json`; the test fails when a recorded file
  changes or disappears. The runner refuses to start if an applied migration's checksum changed.

### NFR-06 Structured JSON logs
- Each request logs one JSON line `{ level, time, msg, correlationId, method, path, status, durationMs, auditId?, findingId? }`.
- `X-Correlation-Id` is honoured when sent, otherwise generated (UUID) and echoed in the response header.
- Service log lines (state changes) include `auditId` / `findingId`.

### NFR-07 Health endpoint
- `GET /health` returns 200 `{status:"ok"}` within 1 second of the process reporting it is listening
  (test spawns the server and measures).

### NFR-08 Architecture rules as tests
- Separation of duties: a finding owner (or the raising auditor) cannot approve their own remediation.
- Closed audits cannot be modified.
- Published controls cannot be mutated.
- Layering: domain imports nothing outside domain; controllers never import repositories; repositories never import
  services/controllers (dependency-cruiser + Vitest).
