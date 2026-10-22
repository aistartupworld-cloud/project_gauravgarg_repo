import { Router } from 'express';
import { actorOf } from '../infrastructure/http/auth';
import { handle } from '../infrastructure/http/handler';
import type { DashboardService } from '../services/dashboardService';
import type { ControllerDeps } from './types';

export function dashboardRouter({ auth }: ControllerDeps, dashboard: DashboardService): Router {
  const router = Router();

  router.get('/dashboard', auth.requireRole('ADMIN', 'AUDITOR', 'REVIEWER'), handle((_req, res) => {
    res.json(dashboard.global(actorOf(res)));
  }));

  router.get('/dashboard/me', auth.requireRole('OWNER'), handle((_req, res) => {
    res.json(dashboard.mine(actorOf(res)));
  }));

  return router;
}
