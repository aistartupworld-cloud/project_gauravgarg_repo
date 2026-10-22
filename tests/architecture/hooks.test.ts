import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ROOT, read } from './support';

// Hooks only fire when Claude Code is started from the repo root (post-mortem PM-001). This suite runs every
// hook against fixed payloads in CI, so a broken or bypassed hook is caught even when no agent session ran it.
function runHook(hook: string, toolInput: Record<string, unknown>, tool = 'Write') {
  const payload = JSON.stringify({ tool_name: tool, tool_input: { ...toolInput, file_path: join(ROOT, String(toolInput.file_path)) } });
  const r = spawnSync('bash', [join(ROOT, '.claude/hooks', hook)], {
    input: payload,
    env: { ...process.env, CLAUDE_PROJECT_DIR: ROOT },
    encoding: 'utf8',
  });
  return { code: r.status, stderr: r.stderr };
}

// remediationService.ts as it was before fix-loop 001: decision written via a variable, no SoD call.
const LEAKY_SERVICE = `
export function review(actor, findingId, input) {
  const { decision, comment } = validateReview(input);
  repos.findings.appendEvent({ findingId, fromState: finding.state, toState: decision, actorId: actor.id, comment });
}`;

describe('[NFR-08][NFR-04][NFR-05][NFR-02] project hooks', () => {
  it('[NFR-08] sod-guard blocks a review path without assertSeparationOfDuties (fix-loop 001 regression)', () => {
    const r = runHook('sod-guard.sh', { file_path: 'server/src/services/newReviewService.ts', content: LEAKY_SERVICE });
    expect(r.code).toBe(2);
    expect(r.stderr).toMatch(/assertSeparationOfDuties/);
  });

  it('[NFR-08] sod-guard allows the current remediation service', () => {
    const file = 'server/src/services/remediationService.ts';
    expect(runHook('sod-guard.sh', { file_path: file, content: read(file) }).code).toBe(0);
  });

  it('[NFR-04] role-boundary-check blocks a route without requireRole', () => {
    const r = runHook('role-boundary-check.sh', { file_path: 'server/src/controllers/x.ts', content: "router.get('/x', handle(fn));" });
    expect(r.code).toBe(2);
    expect(runHook('role-boundary-check.sh', { file_path: 'server/src/controllers/x.ts', content: "router.get('/x', auth.requireRole('ADMIN'), h);" }).code).toBe(0);
  });

  it('[NFR-04] role-boundary-check blocks controllers importing repositories', () => {
    const r = runHook('role-boundary-check.sh', { file_path: 'server/src/controllers/x.ts', content: "import { r } from '../repositories/auditRepository';" });
    expect(r.code).toBe(2);
  });

  it('[NFR-05] migration-append-only-check blocks editing an existing migration but allows a new one', () => {
    expect(runHook('migration-append-only-check.sh', { file_path: 'server/migrations/001_init_core.sql', old_string: 'a', new_string: 'b' }, 'Edit').code).toBe(2);
    expect(runHook('migration-append-only-check.sh', { file_path: 'server/migrations/999_new_thing.sql', content: 'SELECT 1;' }).code).toBe(0);
  });

  it('[NFR-02] finding-immutability-check blocks UPDATE on append-only tables', () => {
    const r = runHook('finding-immutability-check.sh', { file_path: 'server/src/repositories/x.ts', content: "db.prepare('UPDATE finding_events SET comment = ?')" });
    expect(r.code).toBe(2);
  });

  it('[AC-01] controls-immutability-check blocks non-draft updates and allows draft edits', () => {
    const bad = runHook('controls-immutability-check.sh', { file_path: 'server/src/repositories/x.ts', content: "db.prepare('UPDATE control_versions SET title = ? WHERE id = ?')" });
    expect(bad.code).toBe(2);
    const file = 'server/src/repositories/controlRepository.ts';
    expect(runHook('controls-immutability-check.sh', { file_path: file, content: read(file) }).code).toBe(0);
  });

  it('[NFR-08] settings.json wires every PreToolUse hook script that exists', () => {
    const settings = JSON.parse(read('.claude/settings.json'));
    const wired = settings.hooks.PreToolUse[0].hooks.map((h: { command: string }) => h.command.split('/').pop()!.replace('"', ''));
    expect(wired.sort()).toEqual(
      ['controls-immutability-check.sh', 'finding-immutability-check.sh', 'migration-append-only-check.sh', 'role-boundary-check.sh', 'sod-guard.sh'].sort(),
    );
  });
});
