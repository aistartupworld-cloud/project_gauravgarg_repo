---
name: evidence-validator
description: Validate remediation evidence metadata before a finding moves to AWAITING_REVIEW (AC-06). Use when changing the evidence upload path or its rules.
---
# Evidence validator

Evidence storage is stubbed: only metadata is stored.

| Field | Rule |
|---|---|
| fileName | 1–200 chars, no path separators |
| contentType | one of `application/pdf`, `image/png`, `image/jpeg`, `text/plain`, `text/csv`, `application/json` |
| sizeBytes | integer, 1 … 26 214 400 (25 MiB) |
| sha256 | 64 lowercase hex chars |
| note | optional, ≤ 1000 chars |

- Only the finding's owner may upload, and only while the finding is `OPEN` or `RE_OPEN`.
- Uploading evidence and moving to `AWAITING_REVIEW` happen in one transaction.
- The returned `storageRef` is `stub://evidence/<findingId>/<evidenceId>`.

Check: `npx vitest run tests/unit/evidencePolicy.test.ts`
