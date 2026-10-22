import type { FindingState, Severity } from './types';

export type SlaDays = Record<Severity, number>;

export interface SlaRuleSet {
  version: number;
  days: SlaDays;
}

export const DEFAULT_SLA_DAYS: SlaDays = { CRITICAL: 7, HIGH: 30, MEDIUM: 60, LOW: 90 };

export function computeDueDate(_detectedOn: string, _severity: Severity, _ruleSet: SlaRuleSet): string {
  throw new Error('not implemented');
}

export function validateSlaDays(_input: Record<string, unknown>): SlaDays {
  throw new Error('not implemented');
}

export interface OverdueStatus {
  escalated: boolean;
  daysOverdue: number;
}

export function overdueStatus(_dueDate: string, _state: FindingState, _today: string): OverdueStatus {
  throw new Error('not implemented');
}
