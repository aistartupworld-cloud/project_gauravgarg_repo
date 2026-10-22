import { describe, expect, it } from 'vitest';
import { codeOnly, sourceFiles } from './support';
import { makeFixture } from '../helpers/fixture';

const APPEND_ONLY = ['audits', 'audit_events'];

describe('[NFR-02] append-only audit records', () => {
  it('[NFR-02] the database aborts UPDATE and DELETE on append-only tables', async () => {
    const f = makeFixture();
    f.publishControls('SOC2', [{ controlId: 'CC6.1' }]);
    f.ctx.services.audits.create(f.actor('ravi.auditor'), {
      frameworkCode: 'SOC2',
      title: 'Append-only check',
      scope: [],
      targetEndDate: '2026-12-01',
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
