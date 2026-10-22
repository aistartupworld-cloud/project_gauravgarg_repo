import { describe, expect, it } from 'vitest';
import {
  FINDING_TRANSITIONS,
  assertFindingTransition,
  canTransitionFinding,
} from '../../server/src/domain/findingStateMachine';
import { FINDING_STATES, type FindingState } from '../../server/src/domain/types';
import { InvalidFindingStateException } from '../../server/src/domain/errors';

// Table from specs/remediation-workflow_spec.md
const ALLOWED: Array<[FindingState, FindingState]> = [
  ['OPEN', 'AWAITING_REVIEW'],
  ['RE_OPEN', 'AWAITING_REVIEW'],
  ['AWAITING_REVIEW', 'REMEDIATED'],
  ['AWAITING_REVIEW', 'RE_OPEN'],
];

describe('[AC-06][AC-07] finding state machine', () => {
  it('[AC-06][AC-07] transition table matches the spec exactly', () => {
    const table = Object.entries(FINDING_TRANSITIONS).flatMap(([from, tos]) => tos.map((to) => [from, to]));
    expect(table.sort()).toEqual([...ALLOWED].sort());
  });

  for (const from of FINDING_STATES) {
    for (const to of FINDING_STATES) {
      const allowed = ALLOWED.some(([f, t]) => f === from && t === to);
      it(`[AC-07] ${from} → ${to} is ${allowed ? 'allowed' : 'rejected'}`, () => {
        expect(canTransitionFinding(from, to)).toBe(allowed);
        if (allowed) expect(() => assertFindingTransition(from, to)).not.toThrow();
        else expect(() => assertFindingTransition(from, to)).toThrow(InvalidFindingStateException);
      });
    }
  }

  it('[AC-07] REMEDIATED is terminal', () => {
    expect(FINDING_TRANSITIONS.REMEDIATED).toEqual([]);
  });
});
