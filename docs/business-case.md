# SecureGate — business case

Business case BC-AINE-015 · Security & Compliance — Enterprise GRC

## The problem

Most mid-size enterprises run compliance audits from spreadsheets and email. An auditor works through ISO 27001,
SOC 2 or CIS controls, writes up what is wrong, and mails it to whoever seems responsible. From that moment the
organisation loses track of three things:

1. **Who owns each gap and by when.** Due dates are set by feel, not by how severe the gap is, so a critical
   access-control weakness can sit for months next to a cosmetic logging issue.
2. **Whether the fix was real.** Owners mark their own work "done". Nobody independent checks the evidence, which
   is exactly the control weakness auditors write up in other teams.
3. **What the posture is today.** Leadership asks "how compliant are we with SOC 2?" and the answer takes a week of
   spreadsheet merging, and is out of date when it arrives.

Every external audit then starts with a scramble to rebuild a history that should have been recorded as it happened.

## Who uses it

| User | What they need | What they get in SecureGate |
|---|---|---|
| **Compliance admin** (GRC lead) | One controls catalogue per framework, consistent SLA policy, a view of what is late | Versioned controls library, versioned SLA rules, escalation queue, user and role management |
| **Auditor** (internal audit, security assurance) | Plan an audit, record findings quickly against the right control, track progress | Audit plans with scope and target dates, an enforced lifecycle, findings tied to a specific control version |
| **Remediation owner** (engineering lead, system owner) | Know exactly what is theirs and when it is due, hand in proof once | A personal workbench of assigned findings with due dates, evidence submission |
| **Reviewer** (independent assurance, second line) | Check evidence and accept or reject it, without being the person who did the work | A review queue, approve / re-open with comment, enforced separation of duties |
| **Leadership / external auditor** (reader) | Posture at a glance and a trustworthy trail | Dashboard; append-only history of every decision |

## Value proposition

SecureGate turns an audit from a document into a tracked workflow with rules the system enforces rather than
rules people are asked to follow:

- **Severity drives the deadline.** A finding's due date is computed from the organisation's SLA policy
  (by default 7 days for critical, 30 high, 60 medium, 90 low). Policies are versioned, so tightening them never
  silently moves a date someone already committed to.
- **Nobody marks their own homework.** The owner of a finding, and the auditor who raised it, are blocked from
  approving its remediation. Only an independent reviewer can close it, and only with a written comment.
- **History cannot be rewritten.** Audits, findings, evidence records and decisions are append-only; published
  control definitions are frozen. An external auditor can trust the trail because the database refuses edits.
- **Late work is visible without asking.** Anything past its due date is flagged as escalated and lands in the
  admin's queue, sorted by how late it is.
- **Posture is one screen.** Control coverage per framework, open findings by severity, overdue items by owner and
  audit progress are computed live.

## Success metrics

| Metric | Baseline (spreadsheet process, typical) | Target after 2 quarters |
|---|---|---|
| Findings with an owner and an SLA due date | ~60 % | 100 % (enforced at creation) |
| Critical findings closed within SLA | unknown / not measured | ≥ 90 % |
| Remediations closed by someone other than the owner | not tracked | 100 % (enforced) |
| Time to answer "what is our SOC 2 coverage?" | days | < 1 minute (dashboard) |
| Overdue findings older than 30 days past due | not visible | trending down quarter on quarter, all visible in queue |
| Audit evidence requests from external auditors answered from the system | rare | ≥ 80 % |

## Domain rules (what the platform guarantees)

1. **Controls library.** Each control has an id, description, category and default severity within a framework.
   Once published, a control version never changes; revisions create a new version.
2. **Audit plan.** An audit names one framework, a scope of controls and a target end date. It gets a unique id
   (`AUD-2026-0001`) and starts PLANNED.
3. **Audit lifecycle.** PLANNED → IN_PROGRESS → FINDINGS_RECORDED → REMEDIATION_IN_PROGRESS → CLOSED, in that order
   only. It can only close when every finding is remediated, and a closed audit is frozen.
4. **Findings.** Recorded against a control in the audit's scope with severity, description and an evidence
   reference. Each starts OPEN with an owner and an SLA due date.
5. **SLA.** Due date = detection date + days for the severity, in whole calendar days. Rules are versioned; each
   finding remembers which version it used.
6. **Remediation.** The owner submits evidence (metadata only in this release) and the finding moves to
   AWAITING_REVIEW. A reviewer marks it REMEDIATED or sends it back as RE_OPEN, always with a comment.
7. **Separation of duties.** Owners and raising auditors cannot approve their own remediation; admins configure but
   do not attest.
8. **Escalation.** A finding past its due date that is not remediated is ESCALATED and appears in the admin queue.
9. **Scoped access.** Owners only ever see findings assigned to them. Every API route declares which roles may call it.
10. **Privacy of system details.** Logs never carry raw IP addresses, hostnames, credential references or asset ids.

## Scope of this release

In scope: everything above, running locally with one command and synthetic seed data.
Out of scope: live vulnerability scanners or SIEM feeds, real secrets management, real certification, real evidence
file storage, integrations with Archer / ServiceNow GRC, production deployment.

## Risks and assumptions

- Sign-in is a synthetic username picker for the demo; a production version would sit behind the corporate IdP.
- Evidence files are not stored; only their metadata and a checksum are, so a later release can bind the real file.
- All people, systems and assets in the seed data are invented.
