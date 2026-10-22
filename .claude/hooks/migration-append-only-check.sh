#!/usr/bin/env bash
# PreToolUse(Edit|Write|MultiEdit): migrations are append-only (NFR-05).
source "$(dirname "$0")/lib.sh"
rel="$(hook_rel_path)"
case "$rel" in
  server/migrations/*.sql)
    if [ -f "${CLAUDE_PROJECT_DIR:-.}/$rel" ]; then
      block "$rel already exists. Migrations are append-only (NFR-05): add the next numbered file instead."
    fi ;;
  server/migrations/migrations.lock.json)
    tool="$(hook_field tool_name)"
    [ "$tool" = "Write" ] && block "Rewrite of migrations.lock.json refused; run 'npm run migrations:lock', which only appends." ;;
esac
exit 0
