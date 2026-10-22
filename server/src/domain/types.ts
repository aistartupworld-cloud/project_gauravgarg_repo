export const ROLES = ['ADMIN', 'AUDITOR', 'OWNER', 'REVIEWER'] as const;
export type Role = (typeof ROLES)[number];

export const SEVERITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const;
export type Severity = (typeof SEVERITIES)[number];
/** Lower rank = more severe. */
export const SEVERITY_RANK: Record<Severity, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

export const AUDIT_STATES = [
  'PLANNED',
  'IN_PROGRESS',
  'FINDINGS_RECORDED',
  'REMEDIATION_IN_PROGRESS',
  'CLOSED',
] as const;
export type AuditState = (typeof AUDIT_STATES)[number];

export const FINDING_STATES = ['OPEN', 'AWAITING_REVIEW', 'REMEDIATED', 'RE_OPEN'] as const;
export type FindingState = (typeof FINDING_STATES)[number];

export const CONTROL_STATUSES = ['DRAFT', 'PUBLISHED'] as const;
export type ControlStatus = (typeof CONTROL_STATUSES)[number];

/** The authenticated user performing an action. */
export interface Actor {
  id: number;
  role: Role;
  username: string;
}

export interface User {
  id: number;
  username: string;
  displayName: string;
  role: Role;
  active: boolean;
  createdAt: string;
}

export interface Framework {
  code: string;
  name: string;
}

export interface ControlVersion {
  id: number;
  frameworkCode: string;
  controlId: string;
  version: number;
  title: string;
  description: string;
  category: string;
  defaultSeverity: Severity;
  status: ControlStatus;
  createdBy: number;
  createdAt: string;
  publishedAt: string | null;
}

export interface AuditEvent {
  seq: number;
  fromState: AuditState | null;
  toState: AuditState;
  actorId: number;
  actor: string;
  note: string | null;
  at: string;
}

export interface Audit {
  auditId: string;
  frameworkCode: string;
  title: string;
  scope: string[];
  targetEndDate: string;
  createdBy: number;
  createdAt: string;
  state: AuditState;
}

export function isRole(v: unknown): v is Role {
  return typeof v === 'string' && (ROLES as readonly string[]).includes(v);
}

export function isSeverity(v: unknown): v is Severity {
  return typeof v === 'string' && (SEVERITIES as readonly string[]).includes(v);
}

export function isAuditState(v: unknown): v is AuditState {
  return typeof v === 'string' && (AUDIT_STATES as readonly string[]).includes(v);
}

export function isFindingState(v: unknown): v is FindingState {
  return typeof v === 'string' && (FINDING_STATES as readonly string[]).includes(v);
}
