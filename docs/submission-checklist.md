# Submission checklist — BC-AINE-015 SecureGate

Maps every mandatory deliverable (brief §8.1) and rubric threshold (§7) to the file that satisfies it.
Verified on a fresh clone: `npm ci && npm start` serves the seeded app; `npm test` 294/294, `npm run test:e2e` 14/14,
`npm run test:arch` 25/25 + 0 dependency violations, `npm run ac:trace` 18/18, `npm run typecheck` clean.

## §8.1 Mandatory deliverables

| # | Requirement | Where |
|---|---|---|
| 1 | Working app, one command, seed data, README quick start | `npm start` · [server/src/seed/](../server/src/seed/) · [README.md](../README.md) |
| 2 | Business case | [docs/business-case.md](business-case.md) |
| 3 | App spec + feature specs with Acceptance Criteria | [specs/app_spec.md](../specs/app_spec.md) + 8 `specs/*_spec.md` (AC-01…AC-10, NFR-01…NFR-08, Given/When/Then) |
| 4 | Layered CLAUDE.md + AGENTS.md as table of contents | root, `server/`, `server/src/{domain,services,repositories,controllers}/`, `server/migrations/`, `web/`, `tests/`, `specs/` · [AGENTS.md](../AGENTS.md) |
| 5 | `.claude/` agents, skills, commands, hooks | 14 agents · 6 skills · 5 commands · 6 hooks (+ `lib.sh`), wired in `.claude/settings.json` |
| 6 | Harness integration, sprint contracts, reviews | `plugin.json` depends on `claude-harness-engine`; [sprint-contracts/](../sprint-contracts/) (5); [specs/reviews/](../specs/reviews/) (5) |
| 7 | `plugin.json` at root, `.mcp.json` with Playwright MCP | [plugin.json](../plugin.json) (+ `.claude-plugin/plugin.json`) · [.mcp.json](../.mcp.json) |
| 8 | Tests: unit, architecture, AC-tagged, Playwright, committed coverage | `tests/unit` (11 files) · `tests/api` (11) · `tests/architecture` (6) · `tests/e2e` (5, 8 snapshots) · [coverage/](../coverage/) |
| 9 | CI with Claude Code Action | [.gitlab-ci.yml](../.gitlab-ci.yml) (claude-review job) · [.github/workflows/ci.yml](../.github/workflows/ci.yml) (`anthropics/claude-code-action@v1`) |
| 10 | PR-driven history | 7 `--no-ff` merges, no direct commits to main · [docs/pr-history.md](pr-history.md) · `git log --first-parent main` |

## §7 Rubric thresholds

| Area | Threshold | Delivered |
|---|---|---|
| 7.1 Specs / AI-native | ≥ 3 skills, 2 commands, 2 hooks, 2 agents | 6 · 5 · 6 · 14 |
| 7.1 | Agent SDK usage in `scripts/` | [scripts/agent-review.ts](../scripts/agent-review.ts) (`query` from `@anthropic-ai/claude-agent-sdk`) |
| 7.1 | Post-mortem / debugging log | [docs/post-mortems/PM-001-hooks-not-firing.md](post-mortems/PM-001-hooks-not-firing.md) · [docs/fix-loops/001-sod-self-approval.md](fix-loops/001-sod-self-approval.md) |
| 7.2 Business | Business case, personas, metrics | [docs/business-case.md](business-case.md) |
| 7.3 Architecture | `docs/architecture.md` with Mermaid | [docs/architecture.md](architecture.md) — C4 context, containers, layers, ERD, sequence |
| 7.3 | `tests/architecture` ≥ 3 structural tests + dependency-cruiser | 6 files, 25 tests · [.dependency-cruiser.cjs](../.dependency-cruiser.cjs) (7 rules) |
| 7.4 Technical | `docs/tdd.md`, ≥ 10 test files | [docs/tdd.md](tdd.md) (replayed red → green) · 33 test files |
| 7.4 | ≥ 3000 lines of code | ≈ 4,660 lines in `server/src` + `web/src`; ≈ 7,100 including tests, scripts and SQL |
| 7.4 | Playwright snapshot directory | [tests/e2e/__snapshots__/](../tests/e2e/__snapshots__/) |
| 7.4 | ≥ 20 unit tests + coverage artefacts | 294 Vitest tests · `coverage/lcov.info`, `cobertura-coverage.xml`, `coverage-summary.json`, `lcov-report/` |
| 7.5 CI/CD | Pipeline gates + AI review | typecheck → architecture + migrations lock + AC trace → coverage → Playwright → Claude review |

## §8.2 Good to have

[docs/fix-loops/](fix-loops/) · [docs/knowledge-deposits.md](knowledge-deposits.md) (KD-01…KD-06) · five sprints ·
bonus agents `doc-writer`, `janitor`, `state-machine-validator-agent`, `archtest-author-agent`.

## Before you submit (manual steps)

1. Push to the assigned Virtusa GitLab project: `git remote add origin <url> && git push -u origin --all`.
2. Protect `main` in GitLab and add `ANTHROPIC_API_KEY` as a masked CI/CD variable for the `claude-review` job.
3. Install the Claude Harness Engine plugin and run one `/sprint` through it (see the disclosure in the README).
