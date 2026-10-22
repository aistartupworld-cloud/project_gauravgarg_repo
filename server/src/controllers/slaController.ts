import { Router } from 'express';
import { actorOf } from '../infrastructure/http/auth';
import { body, handle } from '../infrastructure/http/handler';
import type { SlaService } from '../services/slaService';
import type { ControllerDeps } from './types';

export function slaRouter({ auth }: ControllerDeps, sla: SlaService): Router {
  const router = Router();

  router.get('/sla-rules', auth.requireRole('ADMIN', 'AUDITOR', 'OWNER', 'REVIEWER'), handle((_req, res) => {
    res.json(sla.overview());
  }));

  router.post('/admin/sla-rules', auth.requireRole('ADMIN'), handle((req, res) => {
    res.status(201).json(sla.publish(actorOf(res), body(req)));
  }));

  return router;
}
