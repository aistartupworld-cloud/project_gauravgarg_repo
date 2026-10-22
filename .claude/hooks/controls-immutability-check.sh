#!/usr/bin/env bash
# PreToolUse(Edit|Write|MultiEdit): published control versions are immutable (AC-01, NFR-08).
source "$(dirname "$0")/lib.sh"
rel="$(hook_rel_path)"
case "$rel" in server/src/*) ;; *) exit 0 ;; esac
text="$(hook_new_text)"
# The only UPDATE allowed on control_versions is publishing a DRAFT row.
if printf '%s' "$text" | grep -Eiq 'UPDATE[[:space:]]+control_versions'; then
  if ! printf '%s' "$text" | grep -Eiq "UPDATE[[:space:]]+control_versions[[:space:]]+SET[[:space:]]+status[[:space:]]*=[[:space:]]*'PUBLISHED'.*status[[:space:]]*=[[:space:]]*'DRAFT'"; then
    block "$rel updates control_versions outside the DRAFT→PUBLISHED path. Create a new version instead (AC-01)."
  fi
fi
exit 0
