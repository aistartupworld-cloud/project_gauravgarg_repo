---
name: escalation-agent
description: Domain agent. Use for overdue detection, ESCALATED flags and the admin escalation queue (AC-08), and for SLA rule changes (AC-05).
tools: Read, Glob, Grep, Write, Edit, Bash
---
- A finding is overdue when `today > dueDate` (UTC calendar days) and its state is not `REMEDIATED`.
- Overdue findings carry `escalated: true` in every API response and appear in `GET /api/admin/escalations`
  sorted by days overdue, descending.
- SLA rule changes create a new version; existing findings keep the version they were created with.
Use `/escalation-report` to print the current queue from the seeded DB.
