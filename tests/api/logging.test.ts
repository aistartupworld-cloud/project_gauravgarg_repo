import { describe, expect, it } from 'vitest';
import { bearer, makeFixture } from '../helpers/fixture';

describe('[NFR-06] structured JSON request logs', () => {
  it('[NFR-06] every request logs one JSON line with a correlation id that is echoed back', async () => {
    const f = makeFixture();
    const res = await f.api.get('/health');
    const id = res.headers['x-correlation-id'];
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
    const line = f.logs.lines.find((l) => l.msg === 'request' && l.path === '/health');
    expect(line).toMatchObject({ level: 'info', correlationId: id, method: 'GET', status: 200 });
    expect(typeof line!.durationMs).toBe('number');
    expect(typeof line!.time).toBe('string');
  });

  it('[NFR-06] honours an incoming X-Correlation-Id', async () => {
    const f = makeFixture();
    await f.api.get('/health').set('X-Correlation-Id', 'trace-abc-123');
    expect(f.logs.lines.some((l) => l.correlationId === 'trace-abc-123')).toBe(true);
  });

  it('[NFR-06] state changes log the auditId with the request correlation id', async () => {
    const f = makeFixture();
    f.publishControls('SOC2', [{ controlId: 'CC6.1' }]);
    const res = await f.api
      .post('/api/audits')
      .set(bearer(await f.token('ravi.auditor')))
      .set('X-Correlation-Id', 'corr-audit-1')
      .send({ frameworkCode: 'SOC2', title: 'Logging audit', scope: [], targetEndDate: '2026-12-01' });
    const service = f.logs.lines.find((l) => l.msg === 'audit.created');
    expect(service).toMatchObject({ auditId: res.body.auditId, correlationId: 'corr-audit-1' });
    const request = f.logs.lines.find((l) => l.msg === 'request' && l.correlationId === 'corr-audit-1');
    expect(request).toMatchObject({ auditId: res.body.auditId, status: 201 });
  });

  it('[NFR-03] masks IPs, hostnames, credentials and asset ids before writing', async () => {
    const f = makeFixture();
    f.ctx.logger.warn('scan.note', { detail: 'ASSET-0042 at 10.1.2.3 (db-01.example.internal) password=abc' });
    const raw = f.logs.raw.join('\n');
    expect(raw).not.toMatch(/10\.1\.2\.3|db-01\.example\.internal|abc|ASSET-0042/);
    expect(raw).toContain('[asset] at [ip] ([host]) [credential]');
  });
});
