# SecureGate

Compliance Audit, Findings & Remediation Platform — AI-Native Engineer capstone, business case **BC-AINE-015**.

Auditors plan audits against versioned control frameworks (ISO 27001, SOC 2, CIS v8) and record findings; owners
remediate and submit evidence; independent reviewers approve or re-open; SLAs escalate overdue work; dashboards show
coverage and risk. Every history table is append-only. All data is synthetic.

## Quick start

Requires **Node.js 22.5+** (for the built-in `node:sqlite`). No database server or external service is needed.

```bash
npm install
npm start            # builds the UI, migrates + seeds data/securegate.db, serves http://localhost:3000
```

Open <http://localhost:3000> and pick a demo user. No passwords: this is a synthetic local demo.

| User | Role | Lands on | Try this |
|---|---|---|---|
| `alice.admin` | Admin | Dashboard | Admin console: change a role, draft and publish a control, publish SLA v2, view escalations |
| `ravi.auditor` | Auditor | Dashboard | Audits → plan an audit → move it to IN PROGRESS → record a finding |
| `olivia.owner` | Owner | My findings | Open `FND-00001` (CRITICAL, overdue) → submit evidence |
| `rhea.reviewer` | Reviewer | Review queue | Open `FND-00003` → approve or re-open with a comment |

Seeded state: 7 users, 20 controls across 3 frameworks, 3 audits, 5 findings covering every finding state, two of
them overdue and escalated. To start again, stop the server and delete `data/securegate.db`.

Useful environment variables: `PORT` (3000), `DB_PATH`, `TOKEN_SECRET`, `LOG_LEVEL` (`debug|info|warn|error`),
`FIXED_NOW` (pin the clock, e.g. `2026-10-22T09:00:00Z`), `SERVE_WEB=false` (API only).
For UI development: `npm run dev:server` and `npm run dev:web` (Vite on 5173, proxying `/api`).

## Tests and quality gates

```bash
npm test               # unit + API + architecture (Vitest, 294 tests)
npm run test:coverage  # same, with coverage → coverage/ (lcov, cobertura, summary)
npm run test:arch      # structural tests + dependency-cruiser layering rules
npm run test:e2e       # Playwright: role journeys, desktop + 390 px, screenshot snapshots
npm run typecheck      # tsc --noEmit over server, web, tests, scripts
npm run ac:trace       # every AC/NFR in specs/ must have a tagged test
npm run agent:review   # headless reviewer agent via the Claude Agent SDK (needs ANTHROPIC_API_KEY)
```

Coverage of `server/src`: **97.9 % lines · 90.8 % branches · 92.9 % functions** (thresholds 85 / 75 / 85).

## How it was built (AI-native)

- **Spec is truth.** [specs/app_spec.md](specs/app_spec.md) and eight feature specs with Given/When/Then acceptance
  criteria. Code that disagrees with a spec is a defect; spec changes come first (see the sprint-3 role-change spec).
- **Agents, skills, commands, hooks** in [.claude/](.claude/), indexed by [AGENTS.md](AGENTS.md); layered
  `CLAUDE.md` files per module and folder. Hooks block edits that would break append-only tables, published controls,
  role checks or separation of duties, and are themselves tested in CI.
- **Sprints** with contracts in [sprint-contracts/](sprint-contracts/), red → green commits, and evaluator reviews in
  [specs/reviews/](specs/reviews/) (one FAIL → fix loop → PASS in sprint 3).
- **Learning artefacts:** [fix loop 001](docs/fix-loops/001-sod-self-approval.md),
  [post-mortem PM-001](docs/post-mortems/PM-001-hooks-not-firing.md), [knowledge deposits](docs/knowledge-deposits.md).
- **Docs:** [business case](docs/business-case.md) · [architecture](docs/architecture.md) · [TDD](docs/tdd.md) ·
  [PR history](docs/pr-history.md).
- **CI:** [.gitlab-ci.yml](.gitlab-ci.yml) and [.github/workflows/ci.yml](.github/workflows/ci.yml) run typecheck,
  architecture, AC trace, coverage and Playwright, then a Claude review (Claude Code Action on GitHub, the Agent SDK
  reviewer on GitLab).

### Disclosure

- The **Claude Harness Engine plugin** was not installable in the build sandbox. `plugin.json` declares it as a
  dependency and the agents follow its planner → tester → implementer → reviewer roles, but the sprint cycles were
  driven by Claude Code directly. Install the plugin and run `/sprint` to exercise it.
- The **Playwright MCP** server is configured in [.mcp.json](.mcp.json) for interactive reviewer walks; in this build
  the reviewer used the Playwright test runner instead.
- PRs are local `--no-ff` merges (see [docs/pr-history.md](docs/pr-history.md)) to be pushed to the assigned GitLab
  project.
- All people, organisations, findings and evidence are synthetic.
