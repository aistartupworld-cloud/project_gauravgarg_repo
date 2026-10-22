import { describe, expect, it } from 'vitest';
import { codeOnly, sourceFiles } from './support';

// SLA and date code paths: no float parsing, no millisecond-per-day division, no rounding of day counts (NFR-01).
const SLA_FILES = ['server/src/domain/slaPolicy.ts', 'server/src/domain/calendar.ts', 'server/src/services/slaService.ts', 'server/src/services/findingService.ts'];
const BANNED: Array<[RegExp, string]> = [
  [/parseFloat\(/, 'parseFloat'],
  [/\/\s*(86_?400_?000|864e5)/, 'division by milliseconds per day'],
  [/Math\.(round|ceil)\(/, 'rounding a day count'],
  [/toFixed\(/, 'toFixed'],
];

describe('[NFR-01] SLA arithmetic is integer day maths', () => {
  it('[NFR-01] SLA code paths contain no float or millisecond-per-day maths', () => {
    const offenders: string[] = [];
    for (const file of SLA_FILES) {
      const src = codeOnly(file);
      for (const [re, what] of BANNED) if (re.test(src)) offenders.push(`${file}: ${what}`);
    }
    expect(offenders).toEqual([]);
  });

  it('[NFR-01] only calendar.ts converts between Date and day numbers in the domain', () => {
    const offenders = sourceFiles('server/src/domain')
      .filter((f) => !f.endsWith('calendar.ts'))
      .filter((f) => /Date\.UTC|getTime\(\)|new Date\(/.test(codeOnly(f)));
    expect(offenders).toEqual([]);
  });
});
