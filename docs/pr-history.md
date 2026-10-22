# Pull-request history

`main` only ever moved through `git merge --no-ff` of a feature branch (no direct commits after the initial
`chore: initialize repository`). Each merge commit is titled `Merge PR #N: <branch> — <summary>`.
Check with `git log --first-parent --oneline main`.

| PR | Branch | Scope | Evidence |
|---|---|---|---|
| #1 | `feat/sprint-0-substrate` | Specs, layered CLAUDE.md, agents, skills, commands, hooks, plugin.json, .mcp.json | [sprint-0 contract](../sprint-contracts/sprint-0-substrate.md) · [review](../specs/reviews/sprint-0-review.md) |
| #2 | `feat/sprint-1-controls-audit` | Controls library, audit plan + lifecycle, auth boundary, JSON logging, health | [contract](../sprint-contracts/sprint-1-controls-audit.md) · [review](../specs/reviews/sprint-1-review.md) |
| #3 | `feat/sprint-2-findings-sla` | Findings, versioned SLA engine, escalation | [contract](../sprint-contracts/sprint-2-findings-sla.md) · [review](../specs/reviews/sprint-2-review.md) |
| #4 | `feat/sprint-3-remediation-sod` | Evidence, review decisions, role change, separation of duties (fix loop 001) | [contract](../sprint-contracts/sprint-3-remediation-sod.md) · [review](../specs/reviews/sprint-3-review.md) · [fix loop](fix-loops/001-sod-self-approval.md) |
| #5 | `feat/sprint-4-dashboard-admin-ui` | Dashboard API, React UI, admin console, Playwright snapshots | [contract](../sprint-contracts/sprint-4-dashboard-admin-ui.md) · [review](../specs/reviews/sprint-4-review.md) |
| #6 | `chore/ci-docs-packaging` | GitLab + GitHub CI with Claude review, Agent SDK reviewer, architecture/TDD docs, coverage report, README | this file |

## How these map to GitLab merge requests

The project was built in an offline sandbox, so each PR above is a local branch merged with `--no-ff`; the merge
commits keep the branch structure intact. After pushing `main` and the branches to the assigned Virtusa GitLab
project, each row can be raised as a merge request, or the history can be reviewed as-is with
`git log --graph --oneline`. From now on, protect `main` ("Allowed to push: No one") so every change arrives through an
MR that `.gitlab-ci.yml` gates.
