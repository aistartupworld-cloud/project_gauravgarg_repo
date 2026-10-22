-- 001: users, frameworks, controls library, audits (sprint 1)
CREATE TABLE users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT    NOT NULL UNIQUE,
  display_name  TEXT    NOT NULL,
  role          TEXT    NOT NULL CHECK (role IN ('ADMIN','AUDITOR','OWNER','REVIEWER')),
  active        INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1)),
  created_at    TEXT    NOT NULL
);

CREATE TABLE frameworks (
  code  TEXT PRIMARY KEY,
  name  TEXT NOT NULL
);

INSERT INTO frameworks (code, name) VALUES
  ('ISO27001', 'ISO/IEC 27001:2022 Annex A'),
  ('SOC2',     'SOC 2 Trust Services Criteria'),
  ('CIS',      'CIS Critical Security Controls v8');

CREATE TABLE control_versions (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  framework_code    TEXT    NOT NULL REFERENCES frameworks(code),
  control_id        TEXT    NOT NULL,
  version           INTEGER NOT NULL CHECK (version >= 1),
  title             TEXT    NOT NULL,
  description       TEXT    NOT NULL,
  category          TEXT    NOT NULL,
  default_severity  TEXT    NOT NULL CHECK (default_severity IN ('CRITICAL','HIGH','MEDIUM','LOW')),
  status            TEXT    NOT NULL CHECK (status IN ('DRAFT','PUBLISHED')),
  created_by        INTEGER NOT NULL REFERENCES users(id),
  created_at        TEXT    NOT NULL,
  published_at      TEXT,
  UNIQUE (framework_code, control_id, version)
);
CREATE INDEX idx_control_versions_lookup ON control_versions (framework_code, control_id, status);

CREATE TABLE audits (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  audit_id         TEXT    NOT NULL UNIQUE,
  framework_code   TEXT    NOT NULL REFERENCES frameworks(code),
  title            TEXT    NOT NULL,
  scope_json       TEXT    NOT NULL,
  target_end_date  TEXT    NOT NULL,
  created_by       INTEGER NOT NULL REFERENCES users(id),
  created_at       TEXT    NOT NULL
);

CREATE TABLE audit_events (
  seq         INTEGER PRIMARY KEY AUTOINCREMENT,
  audit_id    TEXT    NOT NULL REFERENCES audits(audit_id),
  from_state  TEXT,
  to_state    TEXT    NOT NULL CHECK (to_state IN ('PLANNED','IN_PROGRESS','FINDINGS_RECORDED','REMEDIATION_IN_PROGRESS','CLOSED')),
  actor_id    INTEGER NOT NULL REFERENCES users(id),
  note        TEXT,
  created_at  TEXT    NOT NULL
);
CREATE INDEX idx_audit_events_audit ON audit_events (audit_id, seq);
