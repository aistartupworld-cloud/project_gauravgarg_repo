-- 005: remediation evidence metadata, append-only (AC-06, NFR-02)
CREATE TABLE evidence (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  evidence_id   TEXT    NOT NULL UNIQUE,
  finding_id    TEXT    NOT NULL REFERENCES findings(finding_id),
  file_name     TEXT    NOT NULL,
  content_type  TEXT    NOT NULL,
  size_bytes    INTEGER NOT NULL CHECK (size_bytes BETWEEN 1 AND 26214400),
  sha256        TEXT    NOT NULL CHECK (length(sha256) = 64),
  note          TEXT,
  storage_ref   TEXT    NOT NULL,
  uploaded_by   INTEGER NOT NULL REFERENCES users(id),
  uploaded_at   TEXT    NOT NULL
);
CREATE INDEX idx_evidence_finding ON evidence (finding_id);

CREATE TRIGGER evidence_no_update BEFORE UPDATE ON evidence
BEGIN SELECT RAISE(ABORT, 'append-only: evidence rows cannot be updated'); END;
CREATE TRIGGER evidence_no_delete BEFORE DELETE ON evidence
BEGIN SELECT RAISE(ABORT, 'append-only: evidence rows cannot be deleted'); END;
