import { describe, expect, it } from 'vitest';
import { assertSeparationOfDuties, type SodContext } from '../../server/src/domain/separationOfDuties';
import { SeparationOfDutiesViolation } from '../../server/src/domain/errors';
import { ROLES } from '../../server/src/domain/types';

const base: SodContext = { deciderId: 9, deciderRole: 'REVIEWER', ownerId: 4, raisedById: 2, evidenceUploaderIds: [4] };

describe('[NFR-08] separation of duties rule', () => {
  it('[NFR-08] an independent reviewer passes', () => {
    expect(() => assertSeparationOfDuties(base)).not.toThrow();
  });

  it.each([
    ['owner', { deciderId: 4 }, /owner/],
    ['raising auditor', { deciderId: 2 }, /raised/],
    ['evidence uploader', { deciderId: 7, evidenceUploaderIds: [4, 7] }, /submitted evidence/],
  ] as const)('[NFR-08] the %s is blocked even with REVIEWER role', (_who, patch, message) => {
    expect(() => assertSeparationOfDuties({ ...base, ...patch })).toThrow(SeparationOfDutiesViolation);
    expect(() => assertSeparationOfDuties({ ...base, ...patch })).toThrow(message);
  });

  it.each(ROLES.filter((r) => r !== 'REVIEWER'))('[NFR-08] role %s can never decide', (role) => {
    expect(() => assertSeparationOfDuties({ ...base, deciderRole: role })).toThrow(SeparationOfDutiesViolation);
  });
});
