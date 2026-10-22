import { describe, expect, it } from 'vitest';
import { codeOnly, sourceFiles } from './support';

// Knowledge deposit KD-04 (docs/fix-loops/001-sod-self-approval.md): decisions are written through a variable,
// so "grep for 'REMEDIATED'" is not enough. Any service that validates a review decision must call
// assertSeparationOfDuties *before* it appends the event.
describe('[NFR-08] separation-of-duties wiring', () => {
  const services = sourceFiles('server/src/services');
  const deciding = services.filter((f) => /validateReview\(|toState:\s*'REMEDIATED'/.test(codeOnly(f)));

  it('[NFR-08] at least one service decides reviews (guards against the check silently matching nothing)', () => {
    expect(deciding.length).toBeGreaterThan(0);
  });

  it('[NFR-08] every deciding service calls assertSeparationOfDuties before appendEvent', () => {
    const offenders = deciding.filter((f) => {
      const src = codeOnly(f);
      const review = src.slice(src.search(/validateReview\(|toState:\s*'REMEDIATED'/));
      const sod = review.indexOf('assertSeparationOfDuties(');
      const write = review.indexOf('appendEvent(');
      return sod === -1 || (write !== -1 && sod > write);
    });
    expect(offenders).toEqual([]);
  });
});
