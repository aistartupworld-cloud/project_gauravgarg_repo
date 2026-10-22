import { Router } from 'express';
import { actorOf } from '../infrastructure/http/auth';
import { body, handle, queryString } from '../infrastructure/http/handler';
import type { AuditService } from '../services/auditService';
import type { ControllerDeps } from './types';

export function auditRouter({ auth }: ControllerDeps, audits: AuditService): Router {
  const router = Router();

  router.get('/audits', auth.requireRole('ADMIN', 'AUDITOR', 'REVIEWER'), handle((req, res) => {
    res.json(audits.list(actorOf(res), { frameworkCode: queryString(req, 'framework') }));
  }));

  router.get('/audits/:auditId', auth.requireRole('ADMIN', 'AUDITOR', 'REVIEWER'), handle((req, res) => {
    res.json(audits.get(actorOf(res), req.params.auditId!));
  }));

  router.post('/audits', auth.requireRole('AUDITOR'), handle((req, res) => {
    res.status(201).json(audits.create(actorOf(res), body(req)));
  }));

  router.post('/audits/:auditId/transition', auth.requireRole('ADMIN', 'AUDITOR'), handle((req, res) => {
    const b = body(req);
    res.json(audits.transition(actorOf(res), req.params.auditId!, b.to, b.note));
  }));

  return router;
}
