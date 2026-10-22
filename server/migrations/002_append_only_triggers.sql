-- 002: database-level immutability (AC-01, NFR-02, NFR-08)
CREATE TRIGGER audits_no_update BEFORE UPDATE ON audits
BEGIN SELECT RAISE(ABORT, 'append-only: audits rows cannot be updated'); END;
CREATE TRIGGER audits_no_delete BEFORE DELETE ON audits
BEGIN SELECT RAISE(ABORT, 'append-only: audits rows cannot be deleted'); END;

CREATE TRIGGER audit_events_no_update BEFORE UPDATE ON audit_events
BEGIN SELECT RAISE(ABORT, 'append-only: audit_events rows cannot be updated'); END;
CREATE TRIGGER audit_events_no_delete BEFORE DELETE ON audit_events
BEGIN SELECT RAISE(ABORT, 'append-only: audit_events rows cannot be deleted'); END;

-- Published control versions are frozen; only DRAFT rows may change (including DRAFT -> PUBLISHED).
CREATE TRIGGER control_versions_no_update_published BEFORE UPDATE ON control_versions
WHEN OLD.status = 'PUBLISHED'
BEGIN SELECT RAISE(ABORT, 'published control versions are immutable'); END;
CREATE TRIGGER control_versions_no_delete_published BEFORE DELETE ON control_versions
WHEN OLD.status = 'PUBLISHED'
BEGIN SELECT RAISE(ABORT, 'published control versions are immutable'); END;
