-- 003: SLA rule sets and findings (sprint 2)
CREATE TABLE sla_rule_sets (
  version        INTEGER PRIMARY KEY,
  critical_days  INTEGER NOT NULL CHECK (critical_days BETWEEN 1 AND 365),
  high_days      INTEGER NOT NULL CHECK (high_days BETWEEN 1 AND 365),
  medium_days    INTEGER NOT NULL CHECK (medium_days BETWEEN 1 AND 365),
  low_days       INTEGER NOT NULL CHECK (low_days BETWEEN 1 AND 365),
  note           TEXT,
  created_by     INTEGER REFERENCES users(id),
  created_at     TEXT    NOT NULL
);

-- v1 is the policy default from the brief; created_by NULL = system.
INSERT INTO sla_rule_sets (version, critical_days, high_days, medium_days, low_days, note, created_by, created_at)
VALUES (1, 7, 30, 60, 90, 'Default policy (brief section 5.1)', NULL, '2026-01-01T00:00:00.000Z');

CREATE TABLE findings (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  finding_id            TEXT    NOT NULL UNIQUE,
  audit_id              TEXT    NOT NULL REFERENCES audits(audit_id),
  framework_code        TEXT    NOT NULL,
  control_id            TEXT    NOT NULL,
  control_version       INTEGER NOT NULL,
  severity              TEXT    NOT NULL CHECK (severity IN ('CRITICAL','HIGH','MEDIUM','LOW')),
  title                 TEXT    NOT NULL,
  description           TEXT    NOT NULL,
  evidence_ref          TEXT    NOT NULL,
  owner_id              INTEGER NOT NULL REFERENCES users(id),
  raised_by             INTEGER NOT NULL REFERENCES users(id),
  detected_on           TEXT    NOT NULL,
  due_date              TEXT    NOT NULL,
  sla_rule_set_version  INTEGER NOT NULL REFERENCES sla_rule_sets(version),
  created_at            TEXT    NOT NULL,
  FOREIGN KEY (framework_code, control_id, control_version)
    REFERENCES control_versions (framework_code, control_id, version)
);
CREATE INDEX idx_findings_audit ON findings (audit_id);
CREATE INDEX idx_findings_owner ON findings (owner_id);

CREATE TABLE finding_events (
  seq          INTEGER PRIMARY KEY AUTOINCREMENT,
  finding_id   TEXT    NOT NULL REFERENCES findings(finding_id),
  from_state   TEXT,
  to_state     TEXT    NOT NULL CHECK (to_state IN ('OPEN','AWAITING_REVIEW','REMEDIATED','RE_OPEN')),
  actor_id     INTEGER NOT NULL REFERENCES users(id),
  comment      TEXT,
  created_at   TEXT    NOT NULL
);
CREATE INDEX idx_finding_events_finding ON finding_events (finding_id, seq);
