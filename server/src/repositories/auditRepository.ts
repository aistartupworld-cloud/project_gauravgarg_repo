import type { Database } from '../infrastructure/db';
import type { Audit, AuditEvent, AuditState } from '../domain/types';
import { num, optStr, str, type Row } from './rows';

export interface NewAudit {
  auditId: string;
  frameworkCode: string;
  title: string;
  scope: string[];
  targetEndDate: string;
  createdBy: number;
  createdAt: string;
}

const CURRENT_STATE = `(SELECT e.to_state FROM audit_events e WHERE e.audit_id = a.audit_id ORDER BY e.seq DESC LIMIT 1)`;

const toAudit = (r: Row): Audit => ({
  auditId: str(r, 'audit_id'),
  frameworkCode: str(r, 'framework_code'),
  title: str(r, 'title'),
  scope: JSON.parse(str(r, 'scope_json')) as string[],
  targetEndDate: str(r, 'target_end_date'),
  createdBy: num(r, 'created_by'),
  createdAt: str(r, 'created_at'),
  state: str(r, 'state') as AuditState,
});

const toEvent = (r: Row): AuditEvent => ({
  seq: num(r, 'seq'),
  fromState: optStr(r, 'from_state') as AuditState | null,
  toState: str(r, 'to_state') as AuditState,
  actorId: num(r, 'actor_id'),
  actor: str(r, 'username'),
  note: optStr(r, 'note'),
  at: str(r, 'created_at'),
});

/** Audits are insert-only; state is the latest appended event (NFR-02). */
export function createAuditRepository(db: Database) {
  return {
    insert(a: NewAudit): void {
      db.prepare(
        `INSERT INTO audits (audit_id, framework_code, title, scope_json, target_end_date, created_by, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ).run(a.auditId, a.frameworkCode, a.title, JSON.stringify(a.scope), a.targetEndDate, a.createdBy, a.createdAt);
    },
    appendEvent(e: { auditId: string; fromState: AuditState | null; toState: AuditState; actorId: number; note?: string | null; at: string }): void {
      db.prepare(
        'INSERT INTO audit_events (audit_id, from_state, to_state, actor_id, note, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      ).run(e.auditId, e.fromState, e.toState, e.actorId, e.note ?? null, e.at);
    },
    findById(auditId: string): Audit | null {
      const r = db.prepare(`SELECT a.*, ${CURRENT_STATE} AS state FROM audits a WHERE a.audit_id = ?`).get(auditId) as Row | undefined;
      return r ? toAudit(r) : null;
    },
    list(filter: { frameworkCode?: string } = {}): Audit[] {
      const rows = filter.frameworkCode
        ? db.prepare(`SELECT a.*, ${CURRENT_STATE} AS state FROM audits a WHERE a.framework_code = ? ORDER BY a.audit_id`).all(filter.frameworkCode)
        : db.prepare(`SELECT a.*, ${CURRENT_STATE} AS state FROM audits a ORDER BY a.audit_id`).all();
      return (rows as Row[]).map(toAudit);
    },
    events(auditId: string): AuditEvent[] {
      return (
        db
          .prepare(
            `SELECT e.*, u.username FROM audit_events e JOIN users u ON u.id = e.actor_id
             WHERE e.audit_id = ? ORDER BY e.seq`,
          )
          .all(auditId) as Row[]
      ).map(toEvent);
    },
    idsForYear(year: number): string[] {
      return (db.prepare('SELECT audit_id FROM audits WHERE audit_id LIKE ?').all(`AUD-${year}-%`) as Row[]).map((r) =>
        str(r, 'audit_id'),
      );
    },
  };
}
export type AuditRepository = ReturnType<typeof createAuditRepository>;
