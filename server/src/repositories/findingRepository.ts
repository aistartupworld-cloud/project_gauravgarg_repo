import type { Database } from '../infrastructure/db';
import type { FindingEvent, FindingRecord, FindingState, Severity } from '../domain/types';
import { num, optStr, str, type Row } from './rows';

export interface NewFinding {
  findingId: string;
  auditId: string;
  frameworkCode: string;
  controlId: string;
  controlVersion: number;
  severity: Severity;
  title: string;
  description: string;
  evidenceRef: string;
  ownerId: number;
  raisedBy: number;
  detectedOn: string;
  dueDate: string;
  slaRuleSetVersion: number;
  createdAt: string;
}

export interface FindingFilter {
  ownerId?: number;
  auditId?: string;
  state?: FindingState;
  severity?: Severity;
}

const BASE = `
  SELECT f.*, o.username AS owner, o.display_name AS owner_name, r.username AS raised_by_name, cv.title AS control_title,
         (SELECT e.to_state FROM finding_events e WHERE e.finding_id = f.finding_id ORDER BY e.seq DESC LIMIT 1) AS state
  FROM findings f
  JOIN users o ON o.id = f.owner_id
  JOIN users r ON r.id = f.raised_by
  JOIN control_versions cv ON cv.framework_code = f.framework_code AND cv.control_id = f.control_id AND cv.version = f.control_version`;

const toFinding = (r: Row): FindingRecord => ({
  findingId: str(r, 'finding_id'),
  auditId: str(r, 'audit_id'),
  frameworkCode: str(r, 'framework_code'),
  controlId: str(r, 'control_id'),
  controlVersion: num(r, 'control_version'),
  controlTitle: str(r, 'control_title'),
  severity: str(r, 'severity') as Severity,
  title: str(r, 'title'),
  description: str(r, 'description'),
  evidenceRef: str(r, 'evidence_ref'),
  ownerId: num(r, 'owner_id'),
  owner: str(r, 'owner'),
  ownerName: str(r, 'owner_name'),
  raisedById: num(r, 'raised_by'),
  raisedBy: str(r, 'raised_by_name'),
  detectedOn: str(r, 'detected_on'),
  dueDate: str(r, 'due_date'),
  slaRuleSetVersion: num(r, 'sla_rule_set_version'),
  createdAt: str(r, 'created_at'),
  state: str(r, 'state') as FindingState,
});

const toEvent = (r: Row): FindingEvent => ({
  seq: num(r, 'seq'),
  fromState: optStr(r, 'from_state') as FindingState | null,
  toState: str(r, 'to_state') as FindingState,
  actorId: num(r, 'actor_id'),
  actor: str(r, 'username'),
  comment: optStr(r, 'comment'),
  at: str(r, 'created_at'),
});

/** Findings are insert-only; state comes from the latest finding_events row (NFR-02). */
export function createFindingRepository(db: Database) {
  return {
    insert(f: NewFinding): void {
      db.prepare(
        `INSERT INTO findings (finding_id, audit_id, framework_code, control_id, control_version, severity, title, description,
           evidence_ref, owner_id, raised_by, detected_on, due_date, sla_rule_set_version, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        f.findingId, f.auditId, f.frameworkCode, f.controlId, f.controlVersion, f.severity, f.title, f.description,
        f.evidenceRef, f.ownerId, f.raisedBy, f.detectedOn, f.dueDate, f.slaRuleSetVersion, f.createdAt,
      );
    },
    appendEvent(e: { findingId: string; fromState: FindingState | null; toState: FindingState; actorId: number; comment?: string | null; at: string }): void {
      db.prepare(
        'INSERT INTO finding_events (finding_id, from_state, to_state, actor_id, comment, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      ).run(e.findingId, e.fromState, e.toState, e.actorId, e.comment ?? null, e.at);
    },
    findById(findingId: string): FindingRecord | null {
      const r = db.prepare(`${BASE} WHERE f.finding_id = ?`).get(findingId) as Row | undefined;
      return r ? toFinding(r) : null;
    },
    list(filter: FindingFilter = {}): FindingRecord[] {
      const where: string[] = [];
      const params: Array<string | number> = [];
      if (filter.ownerId !== undefined) (where.push('f.owner_id = ?'), params.push(filter.ownerId));
      if (filter.auditId) (where.push('f.audit_id = ?'), params.push(filter.auditId));
      if (filter.severity) (where.push('f.severity = ?'), params.push(filter.severity));
      const sql = `${BASE}${where.length ? ` WHERE ${where.join(' AND ')}` : ''} ORDER BY f.finding_id`;
      const rows = (db.prepare(sql).all(...params) as Row[]).map(toFinding);
      return filter.state ? rows.filter((r) => r.state === filter.state) : rows;
    },
    events(findingId: string): FindingEvent[] {
      return (
        db
          .prepare(
            `SELECT e.*, u.username FROM finding_events e JOIN users u ON u.id = e.actor_id
             WHERE e.finding_id = ? ORDER BY e.seq`,
          )
          .all(findingId) as Row[]
      ).map(toEvent);
    },
    lastFindingId(): string | null {
      const r = db.prepare('SELECT finding_id FROM findings ORDER BY id DESC LIMIT 1').get() as Row | undefined;
      return r ? str(r, 'finding_id') : null;
    },
  };
}
export type FindingRepository = ReturnType<typeof createFindingRepository>;
