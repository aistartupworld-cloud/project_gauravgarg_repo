import { describe, expect, it } from 'vitest';
import { buildDashboard, buildOwnerDashboard, type DashboardInput } from '../../server/src/domain/dashboardAggregator';
import type { Audit, FindingView } from '../../server/src/domain/types';

const audit = (auditId: string, frameworkCode: string, state: Audit['state'], scope: string[] = []): Audit => ({
  auditId,
  frameworkCode,
  title: `Audit ${auditId}`,
  scope,
  targetEndDate: '2026-12-31',
  createdBy: 1,
  createdAt: '2026-10-01T00:00:00.000Z',
  state,
});

let seq = 0;
const finding = (p: Partial<FindingView>): FindingView => ({
  findingId: `FND-${String(++seq).padStart(5, '0')}`,
  auditId: 'AUD-2026-0001',
  frameworkCode: 'SOC2',
  controlId: 'CC6.1',
  controlVersion: 1,
  controlTitle: 'Control',
  severity: 'HIGH',
  title: 'Finding',
  description: 'd',
  evidenceRef: 'e',
  ownerId: 4,
  owner: 'olivia.owner',
  ownerName: 'Olivia Owner',
  raisedById: 2,
  raisedBy: 'ravi.auditor',
  detectedOn: '2026-10-01',
  dueDate: '2026-10-31',
  slaRuleSetVersion: 1,
  createdAt: '2026-10-01T00:00:00.000Z',
  state: 'OPEN',
  escalated: false,
  daysOverdue: 0,
  ...p,
});

const base = (): DashboardInput => ({
  frameworks: [
    { code: 'SOC2', name: 'SOC 2' },
    { code: 'ISO27001', name: 'ISO 27001' },
  ],
  publishedControls: { SOC2: ['CC6.1', 'CC6.2', 'CC7.2', 'CC8.1'], ISO27001: ['A.5.1', 'A.8.8', 'A.8.13'] },
  audits: [],
  findings: [],
});

describe('[AC-09] dashboard aggregation', () => {
  it('[AC-09] coverage = assessed / published, integer floor, PLANNED audits do not count', () => {
    const input = base();
    input.audits = [audit('AUD-2026-0001', 'SOC2', 'IN_PROGRESS', ['CC6.1', 'CC7.2']), audit('AUD-2026-0002', 'ISO27001', 'PLANNED')];
    const d = buildDashboard(input);
    expect(d.coverage).toEqual([
      { frameworkCode: 'SOC2', name: 'SOC 2', published: 4, assessed: 2, coveragePct: 50 },
      { frameworkCode: 'ISO27001', name: 'ISO 27001', published: 3, assessed: 0, coveragePct: 0 },
    ]);
  });

  it('[AC-09] empty scope covers the whole framework; overlapping audits count a control once; floor not round', () => {
    const input = base();
    input.audits = [audit('AUD-2026-0001', 'ISO27001', 'CLOSED', ['A.5.1']), audit('AUD-2026-0002', 'ISO27001', 'IN_PROGRESS', ['A.5.1', 'A.8.8'])];
    expect(buildDashboard(input).coverage[1]).toMatchObject({ assessed: 2, coveragePct: 66 });
    input.audits.push(audit('AUD-2026-0003', 'ISO27001', 'FINDINGS_RECORDED', []));
    expect(buildDashboard(input).coverage[1]).toMatchObject({ assessed: 3, coveragePct: 100 });
  });

  it('[AC-09] a framework without published controls has 0% coverage', () => {
    const input = base();
    input.publishedControls = { SOC2: [], ISO27001: [] };
    expect(buildDashboard(input).coverage.map((c) => c.coveragePct)).toEqual([0, 0]);
  });

  it('[AC-09] open findings by severity always lists all four severities', () => {
    const input = base();
    input.findings = [finding({ severity: 'HIGH' }), finding({ severity: 'HIGH', state: 'REMEDIATED' }), finding({ severity: 'CRITICAL', state: 'AWAITING_REVIEW' })];
    expect(buildDashboard(input).openBySeverity).toEqual({ CRITICAL: 1, HIGH: 1, MEDIUM: 0, LOW: 0 });
  });

  it('[AC-09][AC-08] overdue items by owner, most overdue owners first', () => {
    const input = base();
    input.findings = [
      finding({ owner: 'omar.owner', ownerName: 'Omar Owner', ownerId: 5, escalated: true, daysOverdue: 30 }),
      finding({ escalated: true, daysOverdue: 3 }),
      finding({ escalated: true, daysOverdue: 12 }),
      finding({ escalated: false }),
    ];
    expect(buildDashboard(input).overdueByOwner).toEqual([
      { owner: 'olivia.owner', ownerName: 'Olivia Owner', count: 2, maxDaysOverdue: 12 },
      { owner: 'omar.owner', ownerName: 'Omar Owner', count: 1, maxDaysOverdue: 30 },
    ]);
  });

  it('[AC-09][AC-03] audit progress follows the lifecycle stage', () => {
    const input = base();
    input.audits = [audit('AUD-2026-0001', 'SOC2', 'FINDINGS_RECORDED'), audit('AUD-2026-0002', 'SOC2', 'PLANNED')];
    input.findings = [finding({}), finding({ state: 'REMEDIATED' })];
    const [a, b] = buildDashboard(input).auditProgress;
    expect(a).toMatchObject({ auditId: 'AUD-2026-0001', stage: 3, progressPct: 50, findingsTotal: 2, findingsRemediated: 1 });
    expect(b).toMatchObject({ auditId: 'AUD-2026-0002', stage: 1, progressPct: 0, findingsTotal: 0 });
  });

  it('[AC-09] per-framework summary', () => {
    const input = base();
    input.audits = [audit('AUD-2026-0001', 'SOC2', 'IN_PROGRESS', ['CC6.1']), audit('AUD-2026-0002', 'SOC2', 'PLANNED')];
    input.findings = [finding({ escalated: true, daysOverdue: 1 }), finding({ state: 'REMEDIATED' })];
    const soc2 = buildDashboard(input).frameworks[0]!;
    expect(soc2).toEqual({
      frameworkCode: 'SOC2',
      name: 'SOC 2',
      publishedControls: 4,
      coveragePct: 25,
      auditsByState: { PLANNED: 1, IN_PROGRESS: 1, FINDINGS_RECORDED: 0, REMEDIATION_IN_PROGRESS: 0, CLOSED: 0 },
      openFindings: 1,
      overdueFindings: 1,
    });
  });

  it('[AC-09] totals', () => {
    const input = base();
    input.audits = [audit('AUD-2026-0001', 'SOC2', 'IN_PROGRESS')];
    input.findings = [finding({ state: 'AWAITING_REVIEW' }), finding({ escalated: true, daysOverdue: 2 }), finding({ state: 'REMEDIATED' })];
    expect(buildDashboard(input).totals).toEqual({ audits: 1, findings: 3, open: 2, overdue: 1, awaitingReview: 1, remediated: 1 });
  });

  it('[AC-09][NFR-04] owner dashboard summarises only the given findings', () => {
    const mine = [finding({ severity: 'CRITICAL', dueDate: '2026-10-20', escalated: true, daysOverdue: 2 }), finding({ dueDate: '2026-11-02' }), finding({ state: 'REMEDIATED' })];
    expect(buildOwnerDashboard(mine)).toEqual({
      openBySeverity: { CRITICAL: 1, HIGH: 1, MEDIUM: 0, LOW: 0 },
      open: 2,
      overdue: 1,
      awaitingReview: 0,
      remediated: 1,
      nextDue: { findingId: mine[0]!.findingId, dueDate: '2026-10-20' },
    });
  });
});
