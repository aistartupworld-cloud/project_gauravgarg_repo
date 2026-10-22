#!/usr/bin/env bash
# PreToolUse(Edit|Write|MultiEdit): every route declares its roles at the controller layer (NFR-04).
source "$(dirname "$0")/lib.sh"
rel="$(hook_rel_path)"
case "$rel" in server/src/controllers/*.ts) ;; *) exit 0 ;; esac
text="$(hook_new_text)"
bad="$(printf '%s\n' "$text" | grep -En "router\.(get|post|put|patch|delete)\(" | grep -Ev "requireRole\(|requireAuthenticated|publicRoute" || true)"
if [ -n "$bad" ]; then
  block "route without requireRole(...) in $rel:
$bad
Declare the allowed roles on the route line (NFR-04)."
fi
case "$rel" in
  server/src/controllers/*) if printf '%s' "$text" | grep -Eq "from ['\"]\.\./repositories"; then
    block "$rel imports a repository. Controllers call services only."; fi ;;
esac
exit 0
