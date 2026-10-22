---
description: Print the current escalation queue (overdue findings) from the local database.
---
Start the app if it is not running, log in as the seeded admin (`POST /api/auth/login {"username":"alice.admin"}`),
call `GET /api/admin/escalations`, and print a table: finding id, severity, owner, due date, days overdue.
