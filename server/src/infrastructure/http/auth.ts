import type { NextFunction, Request, Response } from 'express';
import { ForbiddenError, UnauthorizedError } from '../../domain/errors';
import { ROLES, type Actor, type Role } from '../../domain/types';
import type { Clock } from '../clock';
import { verifyToken } from '../auth/tokens';

export interface AuthDeps {
  secret: string;
  clock: Clock;
  /** Loads the current user; the role always comes from the database, never from token claims. */
  resolveActor(userId: number): Actor | null;
}

export interface AuthGuards {
  /** Authenticates the bearer token and allows only the listed roles (NFR-04). */
  requireRole(...roles: Role[]): (req: Request, res: Response, next: NextFunction) => void;
  /** Any signed-in user. */
  requireAuthenticated: (req: Request, res: Response, next: NextFunction) => void;
}

/** Marker for the few routes that are intentionally public (sign-in, health). */
export const publicRoute = (_req: Request, _res: Response, next: NextFunction) => next();

export function actorOf(res: Response): Actor {
  const actor = res.locals.actor as Actor | undefined;
  if (!actor) throw new UnauthorizedError('Not signed in');
  return actor;
}

export function createAuthGuards(deps: AuthDeps): AuthGuards {
  const authenticate = (req: Request): Actor => {
    const header = req.header('authorization') ?? '';
    const match = /^Bearer\s+(\S+)$/i.exec(header);
    if (!match) throw new UnauthorizedError('Missing bearer token');
    const claims = verifyToken(match[1]!, deps.secret, deps.clock.now());
    if (!claims) throw new UnauthorizedError('Invalid or expired token');
    const actor = deps.resolveActor(claims.sub);
    if (!actor) throw new UnauthorizedError('User is not active');
    return actor;
  };

  const requireRole =
    (...roles: Role[]) =>
    (req: Request, res: Response, next: NextFunction) => {
      try {
        const actor = authenticate(req);
        if (!roles.includes(actor.role)) {
          throw new ForbiddenError(`This action requires role ${roles.join(' or ')}`);
        }
        res.locals.actor = actor;
        next();
      } catch (err) {
        next(err);
      }
    };

  return { requireRole, requireAuthenticated: requireRole(...ROLES) };
}
