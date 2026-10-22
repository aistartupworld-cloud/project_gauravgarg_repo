import { describe, expect, it } from 'vitest';
import { MAX_EVIDENCE_BYTES, evidenceStorageRef, validateEvidence } from '../../server/src/domain/evidencePolicy';
import { ValidationError } from '../../server/src/domain/errors';

const ok = {
  fileName: 'firewall-rules-after.pdf',
  contentType: 'application/pdf',
  sizeBytes: 48_213,
  sha256: 'a'.repeat(64),
  note: 'Rule 14 removed; VPN-only access now enforced.',
};

describe('[AC-06] evidence metadata rules', () => {
  it('[AC-06] accepts valid metadata', () => {
    expect(validateEvidence(ok)).toEqual(ok);
    expect(validateEvidence({ ...ok, note: undefined })).toEqual({ ...ok, note: null });
  });

  it('[AC-06] 25 MiB is the inclusive upper bound', () => {
    expect(MAX_EVIDENCE_BYTES).toBe(26_214_400);
    expect(() => validateEvidence({ ...ok, sizeBytes: MAX_EVIDENCE_BYTES })).not.toThrow();
  });

  it.each([
    ['fileName', '../etc/passwd'],
    ['fileName', ''],
    ['contentType', 'application/x-msdownload'],
    ['sizeBytes', 0],
    ['sizeBytes', 30 * 1024 * 1024],
    ['sizeBytes', 10.5],
    ['sha256', 'ABC'],
    ['sha256', 'G'.repeat(64)],
    ['note', 'x'.repeat(1001)],
  ])('[AC-06] rejects %s = %j', (field, value) => {
    try {
      validateEvidence({ ...ok, [field]: value });
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(ValidationError);
      expect((e as ValidationError).fields).toHaveProperty(field);
    }
  });

  it('[AC-06] storage is stubbed with a stable reference', () => {
    expect(evidenceStorageRef('FND-00007', 'EVD-00003')).toBe('stub://evidence/FND-00007/EVD-00003');
  });
});
