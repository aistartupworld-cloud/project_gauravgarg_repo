---
name: sla-evaluator
description: Compute or verify a finding's due date and overdue status from severity-based SLA rules (AC-05, AC-08, NFR-01). Use when writing or reviewing anything that touches due dates, SLA rule sets or escalation.
---
# SLA evaluator

## Rule
`dueDate = addDays(detectedOn, ruleSet.days[severity])` on UTC calendar dates.
Default rule set v1: CRITICAL 7 · HIGH 30 · MEDIUM 60 · LOW 90.
Overdue ⇔ `today > dueDate` and state ≠ `REMEDIATED`. `daysOverdue = daysBetween(dueDate, today)`.

## Must
- Use `addDays` / `daysBetween` from `server/src/domain/calendar.ts` (integer day numbers). Never divide
  milliseconds by 86 400 000 or use floats (NFR-01).
- Store `sla_rule_set_version` on each finding; later rule changes never move an existing due date.
- Reject rule sets with non-integer or non-positive days.

## Worked edge cases (all must hold)
| detectedOn | severity | due |
|---|---|---|
| 2026-02-25 | CRITICAL | 2026-03-04 (crosses Feb in a non-leap year) |
| 2028-02-25 | CRITICAL | 2028-03-03 (leap year) |
| 2026-12-20 | HIGH | 2027-01-19 (year boundary) |
| 2026-03-28 | CRITICAL | 2026-04-04 (DST change irrelevant: UTC dates) |

## Check
`npx vitest run tests/unit/slaPolicy.test.ts`
