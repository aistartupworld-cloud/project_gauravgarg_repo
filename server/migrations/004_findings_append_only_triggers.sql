-- 004: findings, their events and SLA rule sets are append-only (NFR-02)
CREATE TRIGGER findings_no_update BEFORE UPDATE ON findings
BEGIN SELECT RAISE(ABORT, 'append-only: findings rows cannot be updated'); END;
CREATE TRIGGER findings_no_delete BEFORE DELETE ON findings
BEGIN SELECT RAISE(ABORT, 'append-only: findings rows cannot be deleted'); END;

CREATE TRIGGER finding_events_no_update BEFORE UPDATE ON finding_events
BEGIN SELECT RAISE(ABORT, 'append-only: finding_events rows cannot be updated'); END;
CREATE TRIGGER finding_events_no_delete BEFORE DELETE ON finding_events
BEGIN SELECT RAISE(ABORT, 'append-only: finding_events rows cannot be deleted'); END;

CREATE TRIGGER sla_rule_sets_no_update BEFORE UPDATE ON sla_rule_sets
BEGIN SELECT RAISE(ABORT, 'append-only: sla_rule_sets rows cannot be updated'); END;
CREATE TRIGGER sla_rule_sets_no_delete BEFORE DELETE ON sla_rule_sets
BEGIN SELECT RAISE(ABORT, 'append-only: sla_rule_sets rows cannot be deleted'); END;

-- Findings of a CLOSED audit cannot gain new events (NFR-08).
CREATE TRIGGER finding_events_closed_audit BEFORE INSERT ON finding_events
WHEN (SELECT e.to_state FROM audit_events e
      JOIN findings f ON f.audit_id = e.audit_id
      WHERE f.finding_id = NEW.finding_id ORDER BY e.seq DESC LIMIT 1) = 'CLOSED'
BEGIN SELECT RAISE(ABORT, 'audit is CLOSED: findings cannot change'); END;
