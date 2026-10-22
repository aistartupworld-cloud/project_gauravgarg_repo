# AGENTS.md — table of contents

This file is an index only. Rules live in the files it points to.

## Instructions (layered CLAUDE.md)

| Scope | File |
|---|---|
| Repository | [CLAUDE.md](CLAUDE.md) |
| Backend module | [server/CLAUDE.md](server/CLAUDE.md) |
| Domain rules folder | [server/src/domain/CLAUDE.md](server/src/domain/CLAUDE.md) |
| Services folder | [server/src/services/CLAUDE.md](server/src/services/CLAUDE.md) |
| Repositories folder | [server/src/repositories/CLAUDE.md](server/src/repositories/CLAUDE.md) |
| Controllers folder | [server/src/controllers/CLAUDE.md](server/src/controllers/CLAUDE.md) |
| Migrations folder | [server/migrations/CLAUDE.md](server/migrations/CLAUDE.md) |
| Frontend module | [web/CLAUDE.md](web/CLAUDE.md) |
| Tests module | [tests/CLAUDE.md](tests/CLAUDE.md) |
| Specs folder | [specs/CLAUDE.md](specs/CLAUDE.md) |

## Specifications

[specs/app_spec.md](specs/app_spec.md) · [controls-library](specs/controls-library_spec.md) ·
[audit-plan](specs/audit-plan_spec.md) · [findings](specs/findings_spec.md) · [sla-engine](specs/sla-engine_spec.md) ·
[remediation-workflow](specs/remediation-workflow_spec.md) · [dashboards](specs/dashboards_spec.md) ·
[admin-console](specs/admin-console_spec.md) · [platform-nfr](specs/platform-nfr_spec.md) · evaluator reviews in [specs/reviews/](specs/reviews/)

## Agents (`.claude/agents/`)

| Agent | Kind | Purpose |
|---|---|---|
| planner | Harness base | Turns a spec into a sprint contract |
| implementer | Harness base (generator, renamed) | Generates code and tests for a sprint contract |
| reviewer | Harness base (evaluator, renamed) | Grades a sprint against its contract, drives Playwright MCP |
| tester | Harness base (test-engineer, renamed) | Writes failing tests first, owns coverage |
| security-reviewer | Harness base | Auth boundary, masking, injection review |
| design-critic | Harness base | Critiques UI against the spec |
| ui-designer | Harness base | Produces UI layouts |
| audit-planner-agent | Domain | Audit plan + lifecycle changes |
| remediation-tracker-agent | Domain | Finding workflow, evidence, separation of duties |
| escalation-agent | Domain | SLA breaches, escalation queue |
| state-machine-validator-agent | Technical | Proves state machines match the spec tables |
| archtest-author-agent | Technical | Writes and extends architecture tests |
| doc-writer | Bonus | Keeps docs in step with specs |
| janitor | Bonus | Dead code, stale fixtures, drift |

## Skills (`.claude/skills/`)

sla-evaluator · finding-state-validator · control-resolver · evidence-validator · audit-tracer · archtest-author

## Commands (`.claude/commands/`)

`/sprint` · `/new-feature-spec` · `/check-sod` · `/ac-trace` · `/escalation-report`

## Hooks (`.claude/hooks/`, wired in `.claude/settings.json`)

migration-append-only-check · finding-immutability-check · controls-immutability-check · role-boundary-check ·
sod-guard · ac-trace-gate (Stop)

## Packaging, MCP, CI

[plugin.json](plugin.json) (project substrate plugin) · [.claude-plugin/plugin.json](.claude-plugin/plugin.json) ·
[.mcp.json](.mcp.json) (Playwright MCP) · [.gitlab-ci.yml](.gitlab-ci.yml) · [.github/workflows/](.github/workflows/) ·
[scripts/agent-review.ts](scripts/agent-review.ts) (Claude Agent SDK)

## Evidence trail

[sprint-contracts/](sprint-contracts/) · [specs/reviews/](specs/reviews/) · [docs/fix-loops/](docs/fix-loops/) ·
[docs/knowledge-deposits.md](docs/knowledge-deposits.md) · [docs/post-mortems/](docs/post-mortems/) ·
[docs/pr-history.md](docs/pr-history.md)

## Design and process docs

[docs/business-case.md](docs/business-case.md) · [docs/architecture.md](docs/architecture.md) (Mermaid C4, layers, ERD, sequence) ·
[docs/tdd.md](docs/tdd.md) (red → green worked example) · [README.md](README.md) (quick start)
