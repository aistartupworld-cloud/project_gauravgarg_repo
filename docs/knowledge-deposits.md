# Knowledge deposits

Recurring or instructive mistakes, and where each was encoded back into the environment (rules, hooks, skills,
tests) so agents do not repeat it. Newest last.

| ID | Sprint | Mistake | Encoded into |
|---|---|---|---|
| KD-01 | 1 | `controls-immutability-check` hook blocked *every* `UPDATE control_versions`, which would also block the DRAFT edits AC-01 requires. | Hook now allows a statement only when its `WHERE` pins `status = 'DRAFT'`; `tests/architecture/hooks.test.ts` has both the block and allow case; `control-resolver` skill states the rule. |
| KD-02 | 1 | IPv6 masking regex split compressed addresses (`[ip][ip]`) and risked masking clock times. | `mask.ts` requires `::` or 7 colons; `[NFR-03] clock times and ISO instants survive` guard test. |
| KD-03 | 2 | Time-travel tests reused an 8-hour token after moving the clock 3 weeks; the API correctly said 401 and the test misread it. | `tests/helpers/fixture.ts` caches tokens per clock hour; `tests/CLAUDE.md` notes it. Rule: when a test moves the clock, re-authenticate. |
| KD-04 | 3 | Review decisions are written through a variable (`toState: decision`), so a grep/hook for `'REMEDIATED'` misses the path that needs separation of duties. Owner-turned-reviewer self-approved. | `assertSeparationOfDuties` (identity-based); `sod-guard.sh` hardened; `sodWiring` architecture test; hook regression test with the leaky code; fix loop 001. |
| KD-05 | 3 | Hand-typed seed checksums were not 64 hex chars; the seed (which replays history through real services) crashed at start-up. | `tests/api/seed.test.ts` seeds an in-memory DB in CI; seed derives checksums with `sha256`. |
| KD-06 | 3 | Project hooks did not run because the agent session started outside the repo root. | PM-001; hooks executed in CI; README says start Claude Code from the repo root; plugin manifest declares hooks. |
