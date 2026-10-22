import { describe, expect, it } from 'vitest';
import { codeOnly, sourceFiles } from './support';
import { makeFixture } from '../helpers/fixture';

const APPEND_ONLY = ['audits', 'audit_events', 'findings', 'finding_events', 'sla_rule_sets'];

describe('[NFR-02] append-only audit records', () => {
  it('[NFR-02] the database aborts UPDATE and DELETE on append-only tables', async () => {
    const f = makeFixture();
    f.publishControls('SOC2', [{ controlId: 'CC6.1' }]);
    const auditor = f.actor('ravi.auditor');
    const audit = f.ctx.services.audits.create(auditor, {
      frameworkCode: 'SOC2',
      title: 'Append-only check',
      scope: [],
      targetEndDate: '2026-12-01',
    });
    f.ctx.services.audits.transition(auditor, audit.auditId, 'IN_PROGRESS');
    f.ctx.services.findings.record(auditor, audit.auditId, {
      controlId: 'CC6.1',
      title: 'Append-only finding',
      description: 'Synthetic',
      evidenceRef: 'WP-1',
      ownerId: f.actor('olivia.owner').id,
    });
    for (const table of APPEND_ONLY) {
      expect(() => f.ctx.db.exec(`UPDATE ${table} SET created_at = created_at`), table).toThrow(/append-only/);
      expect(() => f.ctx.db.exec(`DELETE FROM ${table}`), table).toThrow(/append-only/);
    }
  });

  it('[NFR-02] repository code never issues UPDATE/DELETE against append-only tables', () => {
    const pattern = new RegExp(`(UPDATE|DELETE\\s+FROM)\\s+(${APPEND_ONLY.join('|')})\\b`, 'i');
    const offenders = sourceFiles('server/src').filter((f) => pattern.test(codeOnly(f)));
    expect(offenders).toEqual([]);
  });
});
