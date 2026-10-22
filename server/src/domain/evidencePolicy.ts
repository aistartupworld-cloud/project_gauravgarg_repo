import { FieldErrors } from './errors';

/** Evidence storage is stubbed: only metadata is kept (brief 6.2, out of scope 6.3). */
export const ALLOWED_EVIDENCE_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'text/plain',
  'text/csv',
  'application/json',
] as const;
export const MAX_EVIDENCE_BYTES = 25 * 1024 * 1024;

export interface EvidenceInput {
  fileName: string;
  contentType: string;
  sizeBytes: number;
  sha256: string;
  note: string | null;
}

export function validateEvidence(input: Record<string, unknown>): EvidenceInput {
  const e = new FieldErrors();
  const name = input.fileName;
  e.check(typeof name === 'string' && name.length >= 1 && name.length <= 200 && !/[\\/]/.test(name) && !name.startsWith('.'), 'fileName', 'must be 1-200 characters with no path separators');
  e.check(typeof input.contentType === 'string' && (ALLOWED_EVIDENCE_TYPES as readonly string[]).includes(input.contentType), 'contentType', `must be one of ${ALLOWED_EVIDENCE_TYPES.join(', ')}`);
  e.check(typeof input.sizeBytes === 'number' && Number.isInteger(input.sizeBytes) && input.sizeBytes >= 1 && input.sizeBytes <= MAX_EVIDENCE_BYTES, 'sizeBytes', 'must be a whole number of bytes from 1 to 25 MiB');
  e.check(typeof input.sha256 === 'string' && /^[0-9a-f]{64}$/.test(input.sha256), 'sha256', 'must be 64 lower-case hex characters');
  e.check(input.note == null || (typeof input.note === 'string' && input.note.length <= 1000), 'note', 'must be up to 1000 characters');
  e.throwIfAny();
  return {
    fileName: name as string,
    contentType: input.contentType as string,
    sizeBytes: input.sizeBytes as number,
    sha256: input.sha256 as string,
    note: (input.note as string | null | undefined) ?? null,
  };
}

export function formatEvidenceId(sequence: number): string {
  return `EVD-${String(sequence).padStart(5, '0')}`;
}

export function evidenceStorageRef(findingId: string, evidenceId: string): string {
  return `stub://evidence/${findingId}/${evidenceId}`;
}

export const REVIEW_DECISIONS = ['REMEDIATED', 'RE_OPEN'] as const;
export type ReviewDecision = (typeof REVIEW_DECISIONS)[number];

export function validateReview(input: Record<string, unknown>): { decision: ReviewDecision; comment: string } {
  const e = new FieldErrors();
  e.check(typeof input.decision === 'string' && (REVIEW_DECISIONS as readonly string[]).includes(input.decision), 'decision', 'must be REMEDIATED or RE_OPEN');
  const comment = typeof input.comment === 'string' ? input.comment.trim() : '';
  e.check(comment.length >= 3 && comment.length <= 1000, 'comment', 'is required (3-1000 characters)');
  e.throwIfAny();
  return { decision: input.decision as ReviewDecision, comment };
}
