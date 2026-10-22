# Fix loop 001 — owner approved their own remediation (separation-of-duties leak)

| | |
|---|---|
| Sprint | 3 (`feat/sprint-3-remediation-sod`) |
| Detected by | reviewer agent, running the NFR-08 scenarios from the sprint contract |
| Requirement | NFR-08 (separation of duties), AC-07, admin-console rule 2 (role changes) |
| Outcome | Fixed in code, hook hardened, two new architecture tests, knowledge deposit KD-04 |

## 1. Detect

The implementer finished AC-06/AC-07 and the suite was green (260 tests). The AC-07 tests only checked that a
**REVIEWER role** can decide, which the controller already enforced with `requireRole('REVIEWER')`.

In the same sprint the spec had changed (commit `spec: allow admin role changes…`): admins can now change a user's
role. The reviewer agent walked the NFR-08 scenario from the contract: *Olivia owns FND-00001, submits evidence,
then moves to the assurance team (role → REVIEWER) and approves her own finding.*

`/check-sod` step 1 found no call to `assertSeparationOfDuties` anywhere in `server/src` (only the rule in
`server/src/services/CLAUDE.md`).

## 2. Reproduce

The reviewer wrote `tests/api/separationOfDuties.api.test.ts` and ran it against the sprint branch:

```
× [NFR-08][AC-07] an owner who later became a reviewer cannot approve their own remediation
  → expected 200 to be 403
× [NFR-08] the auditor who raised the finding cannot approve it after becoming a reviewer
  → expected 200 to be 403
× [NFR-08] conflicted users cannot send it back either (spec: any decision)
  → expected 200 to be 403
✓ [NFR-08] separation of duties on remediation approval > an independent reviewer can approve
Tests  3 failed | 1 passed (4)
```

Olivia's self-approval returned **200** and the finding became REMEDIATED.

## 3. Root cause (environment first)

Two layers should have stopped this before the reviewer did, and neither did:

1. **The `sod-guard` hook never fired during the build.** Hooks are wired in `.claude/settings.json`, which Claude
   Code loads from the project root. The build session had been started from the parent directory, so no project
   hook ran for any edit. See post-mortem [PM-001](../post-mortems/PM-001-hooks-not-firing.md).
2. **Even if it had fired, the hook would have missed it.** `sod-guard.sh` looked for the literal `'REMEDIATED'`.
   The service writes the decision through a variable (`toState: decision`), so the pattern did not match. Feeding
   the leaky file to the hook by hand confirmed `exit 0`.

The code itself was a faithful reading of AC-07 alone; the gap was that the rule lived only in prose
(`services/CLAUDE.md`) and in a hook that could not see it.

## 4. Fix

- **Domain rule** `server/src/domain/separationOfDuties.ts` — `assertSeparationOfDuties` compares **user ids**
  (owner, raising auditor, every evidence uploader) and requires the REVIEWER role, so role changes cannot reopen
  the hole. Unit-tested in `tests/unit/separationOfDuties.test.ts`.
- **Service** `remediationService.review` calls it after the state check and before `appendEvent`.
- **Logging** `security.denied` warn line on every SoD/forbidden rejection, with the actor id.

## 5. Validate

```
✓ tests/api/separationOfDuties.api.test.ts (4 tests)
Test Files  25 passed (25)
Tests  281 passed (281)
```

Mutation check: removing the `assertSeparationOfDuties` call again makes 4 tests fail at once — the 3 API
scenarios and the new `sodWiring` architecture test — so the rule is now guarded twice.

## 6. Encode it so it cannot recur

| Layer | Change |
|---|---|
| Hook | `sod-guard.sh` now triggers on `validateReview(`, `ReviewDecision`, `'REMEDIATED'` or the `findings.review` permission, not just the literal |
| Hook test | `tests/architecture/hooks.test.ts` runs every hook in CI with fixed payloads, including the exact leaky service as a regression case — hooks are verified even when no agent session loads them |
| Arch test | `tests/architecture/sodWiring.test.ts` — every service that validates a review must call `assertSeparationOfDuties` **before** `appendEvent` |
| Spec | remediation-workflow rule 5 states that SoD compares identities, not roles |
| Knowledge | KD-04 in `docs/knowledge-deposits.md` |

## 7. PR

Merged as **PR #4** (`feat/sprint-3-remediation-sod`) after reviewer round 2 PASS.
