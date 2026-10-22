#!/usr/bin/env bash
# PreToolUse(Edit|Write|MultiEdit): published control versions are immutable (AC-01, NFR-08).
# An UPDATE/DELETE on control_versions is allowed only when its WHERE clause pins status = 'DRAFT'.
source "$(dirname "$0")/lib.sh"
rel="$(hook_rel_path)"
case "$rel" in server/src/*) ;; *) exit 0 ;; esac
offending="$(hook_new_text | node -e '
  let s = ""; process.stdin.on("data", d => s += d).on("end", () => {
    const bad = [];
    for (const m of s.matchAll(/(UPDATE|DELETE\s+FROM)\s+control_versions\b/gi)) {
      const stmt = s.slice(m.index, m.index + 500).split(/[`;]/)[0];
      if (!/WHERE[\s\S]*status\s*=\s*\x27DRAFT\x27/i.test(stmt)) bad.push(stmt.split("\n")[0].trim());
    }
    process.stdout.write(bad.join("\n"));
  });')"
if [ -n "$offending" ]; then
  block "$rel changes control_versions without restricting to DRAFT rows:
$offending
Published versions are immutable — revise the control to create a new version (AC-01)."
fi
exit 0
