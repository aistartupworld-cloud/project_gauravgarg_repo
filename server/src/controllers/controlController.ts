import { Router } from 'express';
import { actorOf } from '../infrastructure/http/auth';
import { body, handle, intParam, queryString } from '../infrastructure/http/handler';
import type { ControlService } from '../services/controlService';
import type { ControllerDeps } from './types';

export function controlRouter({ auth }: ControllerDeps, controls: ControlService): Router {
  const router = Router();

  router.get('/frameworks', auth.requireRole('ADMIN', 'AUDITOR', 'OWNER', 'REVIEWER'), handle((_req, res) => {
    res.json(controls.frameworks());
  }));

  router.get('/controls', auth.requireRole('ADMIN', 'AUDITOR', 'REVIEWER'), handle((req, res) => {
    res.json(controls.listPublished(actorOf(res), queryString(req, 'framework')));
  }));

  router.get('/admin/controls', auth.requireRole('ADMIN'), handle((req, res) => {
    res.json(controls.listAllVersions(actorOf(res), queryString(req, 'framework')));
  }));

  router.post('/admin/controls', auth.requireRole('ADMIN'), handle((req, res) => {
    res.status(201).json(controls.createDraft(actorOf(res), body(req)));
  }));

  router.patch('/admin/controls/:id', auth.requireRole('ADMIN'), handle((req, res) => {
    res.json(controls.updateDraft(actorOf(res), intParam(req, 'id'), body(req)));
  }));

  router.post('/admin/controls/:id/publish', auth.requireRole('ADMIN'), handle((req, res) => {
    res.json(controls.publish(actorOf(res), intParam(req, 'id')));
  }));

  router.post('/admin/controls/:id/revise', auth.requireRole('ADMIN'), handle((req, res) => {
    res.status(201).json(controls.revise(actorOf(res), intParam(req, 'id'), body(req)));
  }));

  return router;
}
