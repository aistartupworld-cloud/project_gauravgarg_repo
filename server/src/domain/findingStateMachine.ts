import { InvalidFindingStateException } from './errors';
import type { FindingState } from './types';

/** Allowed finding transitions — must equal the table in specs/remediation-workflow_spec.md. */
export const FINDING_TRANSITIONS: Readonly<Record<FindingState, readonly FindingState[]>> = Object.freeze({
  OPEN: ['AWAITING_REVIEW'],
  AWAITING_REVIEW: ['REMEDIATED', 'RE_OPEN'],
  RE_OPEN: ['AWAITING_REVIEW'],
  REMEDIATED: [],
});

export function canTransitionFinding(from: FindingState, to: FindingState): boolean {
  return FINDING_TRANSITIONS[from].includes(to);
}

export function assertFindingTransition(from: FindingState, to: FindingState): void {
  if (!canTransitionFinding(from, to)) {
    const allowed = FINDING_TRANSITIONS[from];
    throw new InvalidFindingStateException(
      `Finding cannot move from ${from} to ${to}` +
        (allowed.length ? `; allowed next state: ${allowed.join(', ')}` : '; it is already remediated'),
    );
  }
}
