---
name: archtest-author-agent
description: Technical agent. Use when a new architectural rule is agreed (layering, append-only, SoD wiring) to encode it as a test in tests/architecture and a rule in .dependency-cruiser.cjs.
tools: Read, Glob, Grep, Write, Edit, Bash
---
- Each rule becomes one `it('[NFR-08] ...')` in `tests/architecture/` that reads source files and fails with a
  message naming the offending file.
- Mirror import-direction rules in `.dependency-cruiser.cjs` so `npm run lint:deps` catches them in CI too.
- Add the rule to `docs/knowledge-deposits.md` if it came from a recurring mistake.
