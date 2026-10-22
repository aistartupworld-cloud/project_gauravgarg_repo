# PM-001 — project hooks silently did not fire during the build

| | |
|---|---|
| Date | Sprint 3 |
| Impact | A separation-of-duties leak (fix loop 001) reached the reviewer instead of being blocked at edit time |
| Severity | Medium — caught before merge; no data affected (synthetic data only) |
| Resolution | Environment fix: hooks verified in CI independently of any agent session; start-up instructions changed |

## What happened

`.claude/settings.json` wires six project hooks (five `PreToolUse` guards and a `Stop` AC-trace gate). During the
sprint 3 fix loop we fed the leaky `remediationService.ts` to `sod-guard.sh` by hand and asked: why did this not
block the edit when the file was written? The edit log showed none of the project hooks had produced output at any
point in sprints 1–3.

## Debugging log (environment first)

1. **Is the hook script broken?** Ran it by hand with a payload that sets `'REMEDIATED'` without the SoD call →
   `exit 2` with the expected message. Script works.
2. **Is it wired?** `.claude/settings.json` → `PreToolUse` → matcher `Edit|Write|MultiEdit` lists all five scripts
   with `"$CLAUDE_PROJECT_DIR"/.claude/hooks/...`. Wiring correct.
3. **Is the settings file loaded?** The agent session's working directory was the *parent* of the repository.
   Claude Code reads project settings (and therefore project hooks) from the directory the session starts in.
   The repo's `.claude/settings.json` was never loaded. **Root cause.**
4. **Would it have caught the bug anyway?** No — the hook matched the literal `'REMEDIATED'` and the code used a
   variable. Second, independent gap (fixed in fix loop 001).

We did not touch the generated service to work around this; we fixed the environment.

## Fixes

1. `tests/architecture/hooks.test.ts` executes every hook script in CI against fixed payloads (block and allow
   cases) and checks `settings.json` wires every script. A hook that is broken, unwired or too weak now fails the
   pipeline even if no developer session ever loaded it.
2. README quick-start and root `CLAUDE.md` say: start Claude Code from the repository root.
3. The plugin manifest (`plugin.json`) declares the same hooks with `${CLAUDE_PLUGIN_ROOT}`, so installing the
   substrate as a plugin activates them regardless of the session directory.

## Lessons

- A guardrail that is never observed firing should be treated as not existing. Test guardrails like code.
- Pattern-matching hooks need a regression corpus of the mistakes they exist to catch.
