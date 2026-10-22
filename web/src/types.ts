// Response shapes of the SecureGate API (kept separate from server code by design: the UI talks HTTP only).
export type Role = 'ADMIN' | 'AUDITOR' | 'OWNER' | 'REVIEWER';
export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type AuditState = 'PLANNED' | 'IN_PROGRESS' | 'FINDINGS_RECORDED' | 'REMEDIATION_IN_PROGRESS' | 'CLOSED';
export type FindingState = 'OPEN' | 'AWAITING_REVIEW' | 'REMEDIATED' | 'RE_OPEN';

export const SEVERITIES: Severity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
export const AUDIT_STATES: AuditState[] = ['PLANNED', 'IN_PROGRESS', 'FINDINGS_RECORDED', 'REMEDIATION_IN_PROGRESS', 'CLOSED'];
export const ROLES: Role[] = ['ADMIN', 'AUDITOR', 'OWNER', 'REVIEWER'];

export interface User {
  id: number;
  username: string;
  displayName: string;
  role: Role;
  active: boolean;
}

export interface Me {
  id: number;
  username: string;
  role: Role;
}

export interface Framework {
  code: string;
  name: string;
}

export interface Control {
  id: number;
  frameworkCode: string;
  controlId: string;
  version: number;
  title: string;
  description: string;
  category: string;
  defaultSeverity: Severity;
  status: 'DRAFT' | 'PUBLISHED';
  publishedAt: string | null;
}

export interface TimelineEvent {
  seq: number;
  fromState: string | null;
  toState: string;
  actor: string;
  at: string;
  note?: string | null;
  comment?: string | null;
}

export interface Audit {
  auditId: string;
  frameworkCode: string;
  title: string;
  scope: string[];
  targetEndDate: string;
  createdAt: string;
  state: AuditState;
  events?: TimelineEvent[];
}

export interface Evidence {
  evidenceId: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  sha256: string;
  note: string | null;
  storageRef: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface Finding {
  findingId: string;
  auditId: string;
  frameworkCode: string;
  controlId: string;
  controlVersion: number;
  controlTitle: string;
  severity: Severity;
  title: string;
  description: string;
  evidenceRef: string;
  owner: string;
  ownerName: string;
  raisedBy: string;
  detectedOn: string;
  dueDate: string;
  slaRuleSetVersion: number;
  state: FindingState;
  escalated: boolean;
  daysOverdue: number;
  events?: TimelineEvent[];
  evidence?: Evidence[];
}

export interface SlaRuleSet {
  version: number;
  days: Record<Severity, number>;
  note: string | null;
  createdBy: string | null;
  createdAt: string;
}

export interface Dashboard {
  coverage: Array<{ frameworkCode: string; name: string; published: number; assessed: number; coveragePct: number }>;
  openBySeverity: Record<Severity, number>;
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

export interface OwnerDashboard {
  openBySeverity: Record<Severity, number>;
  open: number;
  overdue: number;
  awaitingReview: number;
  remediated: number;
  nextDue: { findingId: string; dueDate: string } | null;
}
