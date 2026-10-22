#!/usr/bin/env bash
# Stop hook: before an agent ends its turn, every AC/NFR in the specs must have a tagged test.
cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0
[ -d node_modules ] || exit 0
out="$(npx --no-install tsx scripts/ac-trace.ts --quiet 2>&1)"
status=$?
if [ $status -ne 0 ]; then
  echo "Acceptance-criteria trace failed. Add tagged tests before finishing:" >&2
  echo "$out" >&2
  exit 2
fi
exit 0
