#!/usr/bin/env bash
# PreToolUse(Edit|Write|MultiEdit): audit/finding/evidence records are append-only (NFR-02).
source "$(dirname "$0")/lib.sh"
rel="$(hook_rel_path)"
case "$rel" in server/src/*|server/migrations/*) ;; *) exit 0 ;; esac
text="$(hook_new_text)"
if printf '%s' "$text" | grep -Eiq '(UPDATE|DELETE[[:space:]]+FROM)[[:space:]]+(audits|audit_events|findings|finding_events|evidence|sla_rule_sets)\b'; then
  # Triggers in migrations legitimately mention these words inside RAISE() guards.
  if printf '%s' "$text" | grep -Eiq 'BEFORE[[:space:]]+(UPDATE|DELETE)[[:space:]]+ON'; then exit 0; fi
  block "$rel would UPDATE/DELETE an append-only table. Append a new event row instead (NFR-02)."
fi
exit 0
