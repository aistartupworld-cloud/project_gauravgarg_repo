import { Router } from 'express';
import { actorOf, publicRoute } from '../infrastructure/http/auth';
import { body, handle } from '../infrastructure/http/handler';
import type { UserService } from '../services/userService';
import type { ControllerDeps } from './types';

export function authRouter({ auth }: ControllerDeps, users: UserService, issueToken: (userId: number) => string): Router {
  const router = Router();

  router.post('/auth/login', publicRoute, handle((req, res) => {
    const user = users.signIn(body(req).username);
    res.json({ token: issueToken(user.id), user });
  }));

  router.get('/auth/me', auth.requireRole('ADMIN', 'AUDITOR', 'OWNER', 'REVIEWER'), handle((_req, res) => {
    res.json(actorOf(res));
  }));

  return router;
}
