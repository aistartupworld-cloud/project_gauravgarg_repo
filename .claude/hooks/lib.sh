#!/usr/bin/env bash
# Shared helpers for SecureGate hooks. Reads the hook JSON payload from stdin once.
HOOK_INPUT="$(cat)"
export HOOK_INPUT

# hook_field <path> : prints a field from the payload, e.g. tool_input.file_path
hook_field() {
  node -e '
    const p = JSON.parse(process.env.HOOK_INPUT || "{}");
    const v = process.argv[1].split(".").reduce((o, k) => (o == null ? o : o[k]), p);
    if (v != null) process.stdout.write(String(v));
  ' "$1"
}

# hook_new_text : prints the text the tool is about to write (Write content, Edit new_string, MultiEdit edits)
hook_new_text() {
  node -e '
    const p = JSON.parse(process.env.HOOK_INPUT || "{}");
    const t = p.tool_input || {};
    const parts = [t.content, t.new_string, ...(t.edits || []).map(e => e.new_string)];
    process.stdout.write(parts.filter(Boolean).join("\n"));
  '
}

# hook_rel_path : file path relative to the project root
hook_rel_path() {
  local f; f="$(hook_field tool_input.file_path)"
  local root="${CLAUDE_PROJECT_DIR:-$(pwd)}"
  printf '%s' "${f#"$root"/}"
}

block() { echo "BLOCKED by $(basename "$0"): $*" >&2; exit 2; }
