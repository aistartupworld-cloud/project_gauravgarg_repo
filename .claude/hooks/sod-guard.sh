#!/usr/bin/env bash
# PreToolUse(Edit|Write|MultiEdit): any service code that can write a review decision must call
# assertSeparationOfDuties (NFR-08). Hardened after fix-loop 001: the first version only looked for the
# literal 'REMEDIATED' and missed `toState: decision`, so the self-approval leak went through unnoticed.
source "$(dirname "$0")/lib.sh"
rel="$(hook_rel_path)"
case "$rel" in server/src/services/*.ts) ;; *) exit 0 ;; esac
f="${CLAUDE_PROJECT_DIR:-.}/$rel"
text="$(hook_new_text)"
# For Edit we only see the fragment; judge the fragment together with the current file.
whole="$text"
[ -f "$f" ] && whole="$(cat "$f")
$text"
if printf '%s' "$whole" | grep -Eq "'REMEDIATED'|validateReview\(|findings\.review'|ReviewDecision"; then
  if ! printf '%s' "$whole" | grep -q "assertSeparationOfDuties("; then
    block "$rel can write a review decision but never calls assertSeparationOfDuties(...). Owners, raising auditors and evidence uploaders must not approve (NFR-08)."
  fi
fi
exit 0
