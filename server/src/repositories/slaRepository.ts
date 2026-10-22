import type { Database } from '../infrastructure/db';
import type { SlaDays, SlaRuleSet } from '../domain/slaPolicy';
import { num, optStr, str, type Row } from './rows';

export interface StoredSlaRuleSet extends SlaRuleSet {
  note: string | null;
  createdBy: string | null;
  createdAt: string;
}

const toRuleSet = (r: Row): StoredSlaRuleSet => ({
  version: num(r, 'version'),
  days: { CRITICAL: num(r, 'critical_days'), HIGH: num(r, 'high_days'), MEDIUM: num(r, 'medium_days'), LOW: num(r, 'low_days') },
  note: optStr(r, 'note'),
  createdBy: optStr(r, 'username'),
  createdAt: str(r, 'created_at'),
});

const SELECT = 'SELECT s.*, u.username FROM sla_rule_sets s LEFT JOIN users u ON u.id = s.created_by';

export function createSlaRepository(db: Database) {
  return {
    active(): StoredSlaRuleSet {
      return toRuleSet(db.prepare(`${SELECT} ORDER BY s.version DESC LIMIT 1`).get() as Row);
    },
    byVersion(version: number): StoredSlaRuleSet | null {
      const r = db.prepare(`${SELECT} WHERE s.version = ?`).get(version) as Row | undefined;
      return r ? toRuleSet(r) : null;
    },
    history(): StoredSlaRuleSet[] {
      return (db.prepare(`${SELECT} ORDER BY s.version DESC`).all() as Row[]).map(toRuleSet);
    },
    insert(r: { version: number; days: SlaDays; note: string | null; createdBy: number; createdAt: string }): void {
      db.prepare(
        `INSERT INTO sla_rule_sets (version, critical_days, high_days, medium_days, low_days, note, created_by, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(r.version, r.days.CRITICAL, r.days.HIGH, r.days.MEDIUM, r.days.LOW, r.note, r.createdBy, r.createdAt);
    },
  };
}
export type SlaRepository = ReturnType<typeof createSlaRepository>;
