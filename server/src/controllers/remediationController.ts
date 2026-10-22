import { Router } from 'express';
import { actorOf } from '../infrastructure/http/auth';
import { body, handle } from '../infrastructure/http/handler';
import type { RemediationService } from '../services/remediationService';
import type { ControllerDeps } from './types';

export function remediationRouter({ auth }: ControllerDeps, remediation: RemediationService): Router {
  const router = Router();

  router.post('/findings/:findingId/evidence', auth.requireRole('OWNER'), handle((req, res) => {
    res.status(201).json(remediation.submitEvidence(actorOf(res), req.params.findingId!, body(req)));
  }));

  router.post('/findings/:findingId/review', auth.requireRole('REVIEWER'), handle((req, res) => {
    res.json(remediation.review(actorOf(res), req.params.findingId!, body(req)));
  }));

  router.get('/reviews/queue', auth.requireRole('REVIEWER'), handle((_req, res) => {
    res.json(remediation.queue(actorOf(res)));
  }));

  return router;
}
