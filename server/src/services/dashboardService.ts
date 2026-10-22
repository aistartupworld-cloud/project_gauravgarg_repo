import { assertCan } from '../domain/accessPolicy';
import { buildDashboard, buildOwnerDashboard, type Dashboard, type OwnerDashboard } from '../domain/dashboardAggregator';
import type { Actor } from '../domain/types';
import type { ServiceDeps } from './context';
import type { FindingService } from './findingService';

export function createDashboardService({ repos }: ServiceDeps, findings: FindingService) {
  return {
    global(actor: Actor): Dashboard {
      assertCan(actor, 'dashboard.global');
      const frameworks = repos.controls.frameworks();
      return buildDashboard({
        frameworks,
        publishedControls: Object.fromEntries(frameworks.map((f) => [f.code, repos.controls.latestPublished(f.code).map((c) => c.controlId)])),
        audits: repos.audits.list(),
        findings: findings.list(actor),
      });
    },

    mine(actor: Actor): OwnerDashboard {
      assertCan(actor, 'dashboard.own');
      return buildOwnerDashboard(findings.list(actor));
    },
  };
}
export type DashboardService = ReturnType<typeof createDashboardService>;
