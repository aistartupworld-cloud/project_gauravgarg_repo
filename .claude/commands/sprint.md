---
description: Run one Generator → Evaluator sprint for a feature spec and leave a PR-ready branch.
argument-hint: <sprint-number> <feature-spec-name>
---
Run sprint $1 for `specs/$2_spec.md`:

1. Use the **planner** agent to write `sprint-contracts/sprint-$1-$2.md`.
2. Create branch `feat/sprint-$1-$2` from `main`.
3. Use the **tester** agent to add failing AC-tagged tests; run them and confirm red.
4. Use the **implementer** agent to make them green. Respect every hook.
5. Use the **reviewer** agent to grade the sprint (it drives Playwright MCP) and write `specs/reviews/sprint-$1-review.md`.
6. While the verdict is RATCHET/FAIL, loop implementer → reviewer. Record any failure loop under `docs/fix-loops/`.
7. On PASS, open a PR (or `git checkout main && git merge --no-ff feat/sprint-$1-$2`). Never commit to main directly.
