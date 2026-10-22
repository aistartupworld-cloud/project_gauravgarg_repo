import { Router } from 'express';
import { isRole } from '../domain/types';
import { ValidationError } from '../domain/errors';
import { actorOf } from '../infrastructure/http/auth';
import { body, handle, intParam, queryString } from '../infrastructure/http/handler';
import type { UserService } from '../services/userService';
import type { ControllerDeps } from './types';

export function userRouter({ auth }: ControllerDeps, users: UserService): Router {
  const router = Router();

  router.get('/admin/users', auth.requireRole('ADMIN'), handle((_req, res) => {
    res.json(users.listAll(actorOf(res)));
  }));

  router.post('/admin/users', auth.requireRole('ADMIN'), handle((req, res) => {
    res.status(201).json(users.create(actorOf(res), body(req)));
  }));

  router.patch('/admin/users/:id/role', auth.requireRole('ADMIN'), handle((req, res) => {
    res.json(users.changeRole(actorOf(res), intParam(req, 'id'), body(req).role));
  }));

  router.get('/users', auth.requireRole('ADMIN', 'AUDITOR'), handle((req, res) => {
    const role = queryString(req, 'role');
    if (!isRole(role)) throw new ValidationError({ role: 'query parameter role is required' });
    res.json(users.listByRole(actorOf(res), role));
  }));

  return router;
}
