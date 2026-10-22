# Sprint 0 contract — AI-native substrate

Branch: `feat/sprint-0-substrate` · Planner: planner agent · Reviewer: reviewer agent

## Goal
Lay down everything agents need before any production code exists: specs, layered instructions, agents, skills,
commands, hooks, plugin packaging, MCP config and the AC trace tool.

## In scope
- `specs/app_spec.md` + 8 feature specs, each with an Acceptance Criteria section (AC-01..AC-10, NFR-01..NFR-08).
- Layered `CLAUDE.md` (root, `server/`, 4 server folders, `server/migrations`, `web/`, `tests/`, `specs/`) and `AGENTS.md` TOC.
- `.claude/agents` (harness base set with canonical names + 5 project agents + 2 bonus), `.claude/skills` (6),
  `.claude/commands` (5), `.claude/hooks` (6) wired in `.claude/settings.json`.
- `plugin.json` at root and `.claude-plugin/plugin.json`; `.mcp.json` with Playwright MCP.
- `scripts/ac-trace.ts`; `docs/business-case.md`.

## Out of scope
Production code and tests (sprint 1+).

## Evaluator checklist
- [ ] Every spec has `## Acceptance Criteria` with at least one `### AC-NN` or `### NFR-NN` heading.
- [ ] `npx tsx scripts/ac-trace.ts` lists 18 criteria (exits 1 now: no tests yet — expected).
- [ ] Each hook blocks its bad case when fed a sample payload (manual run).
- [ ] `plugin.json` paths resolve to files that exist.
- [ ] `.mcp.json` parses and names the `playwright` server.
