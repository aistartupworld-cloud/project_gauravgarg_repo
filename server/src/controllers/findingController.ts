import { Router } from 'express';
import { actorOf } from '../infrastructure/http/auth';
import { body, handle } from '../infrastructure/http/handler';
import type { FindingService } from '../services/findingService';
import type { ControllerDeps } from './types';

export function findingRouter({ auth }: ControllerDeps, findings: FindingService): Router {
  const router = Router();

  router.post('/audits/:auditId/findings', auth.requireRole('AUDITOR'), handle((req, res) => {
    res.status(201).json(findings.record(actorOf(res), req.params.auditId!, body(req)));
  }));

  router.get('/findings', auth.requireRole('ADMIN', 'AUDITOR', 'REVIEWER', 'OWNER'), handle((req, res) => {
    res.json(findings.list(actorOf(res), req.query as Record<string, unknown>));
  }));

  router.get('/findings/:findingId', auth.requireRole('ADMIN', 'AUDITOR', 'REVIEWER', 'OWNER'), handle((req, res) => {
    res.json(findings.get(actorOf(res), req.params.findingId!));
  }));

  router.get('/admin/escalations', auth.requireRole('ADMIN'), handle((_req, res) => {
    res.json(findings.escalations(actorOf(res)));
  }));

  return router;
}
