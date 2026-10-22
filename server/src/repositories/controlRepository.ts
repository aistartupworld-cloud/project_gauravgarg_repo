import type { Database } from '../infrastructure/db';
import type { ControlStatus, ControlVersion, Framework, Severity } from '../domain/types';
import { num, optStr, str, type Row } from './rows';

export interface NewControlVersion {
  frameworkCode: string;
  controlId: string;
  version: number;
  title: string;
  description: string;
  category: string;
  defaultSeverity: Severity;
  createdBy: number;
  createdAt: string;
}

const toControl = (r: Row): ControlVersion => ({
  id: num(r, 'id'),
  frameworkCode: str(r, 'framework_code'),
  controlId: str(r, 'control_id'),
  version: num(r, 'version'),
  title: str(r, 'title'),
  description: str(r, 'description'),
  category: str(r, 'category'),
  defaultSeverity: str(r, 'default_severity') as Severity,
  status: str(r, 'status') as ControlStatus,
  createdBy: num(r, 'created_by'),
  createdAt: str(r, 'created_at'),
  publishedAt: optStr(r, 'published_at'),
});

/** Latest published version per control in a framework. */
const LATEST_PUBLISHED = `
  SELECT cv.* FROM control_versions cv
  WHERE cv.status = 'PUBLISHED' AND cv.framework_code = ?
    AND cv.version = (SELECT MAX(v.version) FROM control_versions v
                      WHERE v.framework_code = cv.framework_code AND v.control_id = cv.control_id
                        AND v.status = 'PUBLISHED')
  ORDER BY cv.control_id`;

export function createControlRepository(db: Database) {
  return {
    frameworks(): Framework[] {
      return (db.prepare('SELECT code, name FROM frameworks ORDER BY code').all() as Row[]).map((r) => ({
        code: str(r, 'code'),
        name: str(r, 'name'),
      }));
    },
    frameworkExists(code: string): boolean {
      return db.prepare('SELECT 1 FROM frameworks WHERE code = ?').get(code) !== undefined;
    },
    insert(c: NewControlVersion): ControlVersion {
      const res = db
        .prepare(
          `INSERT INTO control_versions
           (framework_code, control_id, version, title, description, category, default_severity, status, created_by, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'DRAFT', ?, ?)`,
        )
        .run(c.frameworkCode, c.controlId, c.version, c.title, c.description, c.category, c.defaultSeverity, c.createdBy, c.createdAt);
      return this.findById(Number(res.lastInsertRowid))!;
    },
    /** Edits a DRAFT row; the WHERE clause and a DB trigger both refuse published rows. */
    updateDraft(id: number, fields: Pick<ControlVersion, 'title' | 'description' | 'category' | 'defaultSeverity'>): void {
      db.prepare(
        `UPDATE control_versions SET title = ?, description = ?, category = ?, default_severity = ?
         WHERE id = ? AND status = 'DRAFT'`,
      ).run(fields.title, fields.description, fields.category, fields.defaultSeverity, id);
    },
    publishDraft(id: number, publishedAt: string): void {
      db.prepare(`UPDATE control_versions SET status = 'PUBLISHED', published_at = ? WHERE id = ? AND status = 'DRAFT'`).run(
        publishedAt,
        id,
      );
    },
    findById(id: number): ControlVersion | null {
      const r = db.prepare('SELECT * FROM control_versions WHERE id = ?').get(id) as Row | undefined;
      return r ? toControl(r) : null;
    },
    versionsOf(frameworkCode: string, controlId: string): ControlVersion[] {
      return (
        db
          .prepare('SELECT * FROM control_versions WHERE framework_code = ? AND control_id = ? ORDER BY version')
          .all(frameworkCode, controlId) as Row[]
      ).map(toControl);
    },
    listAll(frameworkCode?: string): ControlVersion[] {
      const rows = frameworkCode
        ? db.prepare('SELECT * FROM control_versions WHERE framework_code = ? ORDER BY control_id, version').all(frameworkCode)
        : db.prepare('SELECT * FROM control_versions ORDER BY framework_code, control_id, version').all();
      return (rows as Row[]).map(toControl);
    },
    latestPublished(frameworkCode: string): ControlVersion[] {
      return (db.prepare(LATEST_PUBLISHED).all(frameworkCode) as Row[]).map(toControl);
    },
    latestPublishedOne(frameworkCode: string, controlId: string): ControlVersion | null {
      const r = db
        .prepare(
          `SELECT * FROM control_versions WHERE framework_code = ? AND control_id = ? AND status = 'PUBLISHED'
           ORDER BY version DESC LIMIT 1`,
        )
        .get(frameworkCode, controlId) as Row | undefined;
      return r ? toControl(r) : null;
    },
  };
}
export type ControlRepository = ReturnType<typeof createControlRepository>;
