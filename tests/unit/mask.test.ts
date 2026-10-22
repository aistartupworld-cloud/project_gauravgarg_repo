import { describe, expect, it } from 'vitest';
import { maskSensitive } from '../../server/src/infrastructure/logging/mask';

describe('[NFR-03] sensitive detail masking', () => {
  it.each([
    ['login from 10.20.30.40 failed', 'login from [ip] failed'],
    ['peer fe80::1ff:fe23:4567:890a dropped', 'peer [ip] dropped'],
    ['db-prod-01.example.internal is unpatched', '[host] is unpatched'],
    ['see wiki.corp and payroll.acme-corp.com', 'see [host] and [host]'],
    ['password=Hunter2 leaked', '[credential] leaked'],
    ['token: abc.def.ghi in header', '[credential] in header'],
    ['ref vault:secret/data/db-creds', 'ref [credential]'],
    ['arn:aws:secretsmanager:eu-west-1:123456789012:secret:db', '[credential]'],
    ['asset ASSET-0042 and ASSET-1 affected', 'asset [asset] and [asset] affected'],
  ])('[NFR-03] masks %j', (input, expected) => {
    expect(maskSensitive(input)).toBe(expected);
  });

  it('[NFR-03] leaves ordinary text, ids and dates alone', () => {
    const s = 'Finding FND-00012 on AUD-2026-0001 due 2026-10-31, control A.5.1 v2';
    expect(maskSensitive(s)).toBe(s);
  });

  it('[NFR-03] masks nested objects and arrays without mutating the input', () => {
    const input = { msg: 'x', detail: { host: 'web-01.example.internal', ips: ['192.168.1.5'] }, n: 4 };
    const out = maskSensitive(input);
    expect(out).toEqual({ msg: 'x', detail: { host: '[host]', ips: ['[ip]'] }, n: 4 });
    expect(input.detail.host).toBe('web-01.example.internal');
  });
});

describe('[NFR-03] masking does not over-match', () => {
  it('[NFR-03] clock times and ISO instants survive', () => {
    expect(maskSensitive('at 09:00:00 on 2026-10-01T09:00:00.000Z')).toBe('at 09:00:00 on 2026-10-01T09:00:00.000Z');
  });
});
