#!/usr/bin/env bash
# PreToolUse(Edit|Write|MultiEdit): any service code that sets REMEDIATED must call assertSeparationOfDuties.
source "$(dirname "$0")/lib.sh"
rel="$(hook_rel_path)"
case "$rel" in server/src/services/*.ts) ;; *) exit 0 ;; esac
f="${CLAUDE_PROJECT_DIR:-.}/$rel"
text="$(hook_new_text)"
# For Edit we only see the fragment; check the fragment plus the current file.
whole="$text"
[ -f "$f" ] && whole="$(cat "$f")
$text"
if printf '%s' "$text" | grep -q "'REMEDIATED'" && ! printf '%s' "$whole" | grep -q "assertSeparationOfDuties("; then
  block "$rel sets REMEDIATED without assertSeparationOfDuties(...). Owners must not approve their own remediation (NFR-08)."
fi
exit 0
