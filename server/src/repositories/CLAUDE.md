# server/src/repositories — persistence

- Parameterised SQL only (`db.prepare(sql).run(...params)`); never string-concatenate user input.
- Append-only tables: `audits`, `audit_events`, `findings`, `finding_events`, `evidence`, `control_versions`
  (once published), `sla_rule_sets`. Repositories expose `insert*` and `find*` methods only for them.
  `UPDATE`/`DELETE` statements on those tables are blocked by `finding-immutability-check` and
  `controls-immutability-check` hooks and by DB triggers from `002_append_only_triggers.sql`.
- Current state is derived from the latest event row (`ORDER BY seq DESC LIMIT 1`).
