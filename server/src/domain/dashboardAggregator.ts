import { auditProgressPct, auditStage } from './auditStateMachine';
import { AUDIT_STATES, SEVERITIES, type Audit, type AuditState, type FindingView, type Framework, type Severity } from './types';

/** Pure dashboard maths (AC-09). All percentages are integer floors. */
export interface DashboardInput {
  frameworks: Framework[];
  /** Latest published control ids per framework code. */
  publishedControls: Record<string, string[]>;
  audits: Audit[];
  findings: FindingView[];
}

export type SeverityCounts = Record<Severity, number>;

export interface Dashboard {
  coverage: Array<{ frameworkCode: string; name: string; published: number; assessed: number; coveragePct: number }>;
  openBySeverity: SeverityCounts;
  overdueByOwner: Array<{ owner: string; ownerName: string; count: number; maxDaysOverdue: number }>;
  auditProgress: Array<{
    auditId: string;
    title: string;
    frameworkCode: string;
    state: AuditState;
    stage: number;
    progressPct: number;
    targetEndDate: string;
    findingsTotal: number;
    findingsRemediated: number;
  }>;
  frameworks: Array<{
    frameworkCode: string;
    name: string;
    publishedControls: number;
    coveragePct: number;
    auditsByState: Record<AuditState, number>;
    openFindings: number;
    overdueFindings: number;
  }>;
  totals: { audits: number; findings: number; open: number; overdue: number; awaitingReview: number; remediated: number };
}

export function percent(part: number, whole: number): number {
  return whole === 0 ? 0 : Math.floor((part * 100) / whole);
}

const isOpen = (f: FindingView) => f.state !== 'REMEDIATED';

export function countBySeverity(findings: FindingView[]): SeverityCounts {
  const counts = Object.fromEntries(SEVERITIES.map((s) => [s, 0])) as SeverityCounts;
  for (const f of findings) if (isOpen(f)) counts[f.severity]++;
  return counts;
}

/** Controls in scope of at least one audit that has left PLANNED; empty scope = whole framework. */
function assessedControls(frameworkCode: string, published: string[], audits: Audit[]): Set<string> {
  const assessed = new Set<string>();
  for (const a of audits) {
    if (a.frameworkCode !== frameworkCode || a.state === 'PLANNED') continue;
    for (const id of a.scope.length ? a.scope : published) if (published.includes(id)) assessed.add(id);
  }
  return assessed;
}

export function buildDashboard(input: DashboardInput): Dashboard {
  const coverage = input.frameworks.map((fw) => {
    const published = input.publishedControls[fw.code] ?? [];
    const assessed = assessedControls(fw.code, published, input.audits).size;
    return { frameworkCode: fw.code, name: fw.name, published: published.length, assessed, coveragePct: percent(assessed, published.length) };
  });

  const byOwner = new Map<string, { owner: string; ownerName: string; count: number; maxDaysOverdue: number }>();
  for (const f of input.findings) {
    if (!f.escalated) continue;
    const row = byOwner.get(f.owner) ?? { owner: f.owner, ownerName: f.ownerName, count: 0, maxDaysOverdue: 0 };
    row.count++;
    row.maxDaysOverdue = Math.max(row.maxDaysOverdue, f.daysOverdue);
    byOwner.set(f.owner, row);
  }
  const overdueByOwner = [...byOwner.values()].sort(
    (a, b) => b.count - a.count || b.maxDaysOverdue - a.maxDaysOverdue || a.owner.localeCompare(b.owner),
  );

  const auditProgress = input.audits.map((a) => {
    const fs = input.findings.filter((f) => f.auditId === a.auditId);
    return {
      auditId: a.auditId,
      title: a.title,
      frameworkCode: a.frameworkCode,
      state: a.state,
      stage: auditStage(a.state),
      progressPct: auditProgressPct(a.state),
      targetEndDate: a.targetEndDate,
      findingsTotal: fs.length,
      findingsRemediated: fs.filter((f) => f.state === 'REMEDIATED').length,
    };
  });

  const frameworks = input.frameworks.map((fw, i) => {
    const auditsByState = Object.fromEntries(AUDIT_STATES.map((s) => [s, 0])) as Record<AuditState, number>;
    for (const a of input.audits) if (a.frameworkCode === fw.code) auditsByState[a.state]++;
    const fs = input.findings.filter((f) => f.frameworkCode === fw.code);
    return {
      frameworkCode: fw.code,
      name: fw.name,
      publishedControls: coverage[i]!.published,
      coveragePct: coverage[i]!.coveragePct,
      auditsByState,
      openFindings: fs.filter(isOpen).length,
      overdueFindings: fs.filter((f) => f.escalated).length,
    };
  });

  const totals = {
    audits: input.audits.length,
    findings: input.findings.length,
    open: input.findings.filter(isOpen).length,
    overdue: input.findings.filter((f) => f.escalated).length,
    awaitingReview: input.findings.filter((f) => f.state === 'AWAITING_REVIEW').length,
    remediated: input.findings.filter((f) => f.state === 'REMEDIATED').length,
  };

  return { coverage, openBySeverity: countBySeverity(input.findings), overdueByOwner, auditProgress, frameworks, totals };
}

export interface OwnerDashboard {
  openBySeverity: SeverityCounts;
  open: number;
  overdue: number;
  awaitingReview: number;
  remediated: number;
  nextDue: { findingId: string; dueDate: string } | null;
}

/** Personal summary for an owner; callers pass only that owner's findings (NFR-04). */
export function buildOwnerDashboard(findings: FindingView[]): OwnerDashboard {
  const actionable = findings.filter((f) => f.state === 'OPEN' || f.state === 'RE_OPEN');
  const next = [...actionable].sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.findingId.localeCompare(b.findingId))[0];
  return {
    openBySeverity: countBySeverity(findings),
    open: findings.filter(isOpen).length,
    overdue: findings.filter((f) => f.escalated).length,
    awaitingReview: findings.filter((f) => f.state === 'AWAITING_REVIEW').length,
    remediated: findings.filter((f) => f.state === 'REMEDIATED').length,
    nextDue: next ? { findingId: next.findingId, dueDate: next.dueDate } : null,
  };
}
