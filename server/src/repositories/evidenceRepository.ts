import type { Database } from '../infrastructure/db';
import type { Evidence } from '../domain/types';
import { num, optStr, str, type Row } from './rows';

const toEvidence = (r: Row): Evidence => ({
  evidenceId: str(r, 'evidence_id'),
  findingId: str(r, 'finding_id'),
  fileName: str(r, 'file_name'),
  contentType: str(r, 'content_type'),
  sizeBytes: num(r, 'size_bytes'),
  sha256: str(r, 'sha256'),
  note: optStr(r, 'note'),
  storageRef: str(r, 'storage_ref'),
  uploadedById: num(r, 'uploaded_by'),
  uploadedBy: str(r, 'username'),
  uploadedAt: str(r, 'uploaded_at'),
});

/** Evidence metadata is insert-only (NFR-02). */
export function createEvidenceRepository(db: Database) {
  return {
    insert(e: Omit<Evidence, 'uploadedBy'>): void {
      db.prepare(
        `INSERT INTO evidence (evidence_id, finding_id, file_name, content_type, size_bytes, sha256, note, storage_ref, uploaded_by, uploaded_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(e.evidenceId, e.findingId, e.fileName, e.contentType, e.sizeBytes, e.sha256, e.note, e.storageRef, e.uploadedById, e.uploadedAt);
    },
    forFinding(findingId: string): Evidence[] {
      return (
        db
          .prepare('SELECT e.*, u.username FROM evidence e JOIN users u ON u.id = e.uploaded_by WHERE e.finding_id = ? ORDER BY e.id')
          .all(findingId) as Row[]
      ).map(toEvidence);
    },
    count(): number {
      return num(db.prepare('SELECT COUNT(*) AS n FROM evidence').get() as Row, 'n');
    },
  };
}
export type EvidenceRepository = ReturnType<typeof createEvidenceRepository>;
