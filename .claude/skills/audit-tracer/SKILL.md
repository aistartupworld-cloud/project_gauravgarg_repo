---
name: audit-tracer
description: Trace one audit or finding through its append-only event history and structured logs (NFR-02, NFR-06). Use when debugging a lifecycle problem or proving who did what.
---
# Audit tracer

1. `GET /api/audits/<auditId>` returns the audit with its `events` (seq, from, to, actor, at).
2. `GET /api/findings/<findingId>` returns the finding with `events` and `evidence`.
3. Logs are JSON lines; filter with `grep '"findingId":"FND-...' server.log` or
   `node scripts/trace-log.mjs <id> < server.log` — every line carries `correlationId`, so you can follow
   one request across services.
4. Never "fix" history: if a transition was wrong, append a corrective event through the API.
