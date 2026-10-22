import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import express, { type Express } from 'express';
import { authRouter } from './controllers/authController';
import { auditRouter } from './controllers/auditController';
import { controlRouter } from './controllers/controlController';
import { findingRouter } from './controllers/findingController';
import { remediationRouter } from './controllers/remediationController';
import { slaRouter } from './controllers/slaController';
import { userRouter } from './controllers/userController';
import type { Clock } from './infrastructure/clock';
import type { Database } from './infrastructure/db';
import { signToken } from './infrastructure/auth/tokens';
import { createAuthGuards, publicRoute } from './infrastructure/http/auth';
import { requestContext } from './infrastructure/http/context';
import { errorHandler, notFoundHandler } from './infrastructure/http/errors';
import type { Logger } from './infrastructure/logging/logger';
import { createRepositories, type Repositories } from './repositories';
import { createAuditService } from './services/auditService';
import { createControlService } from './services/controlService';
import { createFindingService } from './services/findingService';
import { createRemediationService } from './services/remediationService';
import { createSlaService } from './services/slaService';
import { createUserService } from './services/userService';

export interface AppOptions {
  db: Database;
  clock: Clock;
  logger: Logger;
  tokenSecret: string;
  /** Directory with the built SPA (web/dist); served when present. */
  webDist?: string | null;
}

export interface AppContext {
  app: Express;
  db: Database;
  clock: Clock;
  logger: Logger;
  repos: Repositories;
  services: ReturnType<typeof createServices>;
}

function createServices(deps: { db: Database; clock: Clock; logger: Logger; repos: Repositories }) {
  const users = createUserService(deps);
  const controls = createControlService(deps);
  const sla = createSlaService(deps);
  const findings = createFindingService(deps);
  const audits = createAuditService(deps, findings);
  const remediation = createRemediationService(deps, findings);
  return { users, controls, sla, findings, audits, remediation };
}

/** Composition root: wires repositories → services → controllers. */
export function createApp(opts: AppOptions): AppContext {
  const { db, clock, logger } = opts;
  const repos = createRepositories(db);
  const services = createServices({ db, clock, logger, repos });
  const auth = createAuthGuards({ secret: opts.tokenSecret, clock, resolveActor: (id) => services.users.actorFor(id) });

  const issueToken = (userId: number) => {
    const actor = services.users.actorFor(userId)!;
    return signToken({ sub: actor.id, role: actor.role, username: actor.username }, opts.tokenSecret, clock.now());
  };

  const app = express();
  app.disable('x-powered-by');
  app.use(requestContext(logger));
  app.use(express.json({ limit: '100kb' }));

  app.get('/health', publicRoute, (_req, res) => {
    res.json({ status: 'ok', time: clock.now().toISOString() });
  });

  const api = express.Router();
  api.use(authRouter({ auth }, services.users, issueToken));
  api.use(userRouter({ auth }, services.users));
  api.use(controlRouter({ auth }, services.controls));
  api.use(auditRouter({ auth }, services.audits));
  api.use(findingRouter({ auth }, services.findings));
  api.use(slaRouter({ auth }, services.sla));
  api.use(remediationRouter({ auth }, services.remediation));
  api.use(notFoundHandler);
  app.use('/api', api);

  const dist = opts.webDist === undefined ? resolve(import.meta.dirname, '../../web/dist') : opts.webDist;
  if (dist && existsSync(join(dist, 'index.html'))) {
    app.use(express.static(dist, { index: false }));
    app.get(/^\/(?!api\/|health$).*/, publicRoute, (_req, res) => res.sendFile(join(dist, 'index.html')));
  }

  app.use(notFoundHandler);
  app.use(errorHandler(logger));
  return { app, db, clock, logger, repos, services };
}
