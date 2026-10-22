import { assertCan } from '../domain/accessPolicy';
import { ConflictError, FieldErrors, NotFoundError, UnauthorizedError, ValidationError } from '../domain/errors';
import { ROLES, isRole, type Actor, type Role, type User } from '../domain/types';
import type { ServiceDeps } from './context';

const USERNAME = /^[a-z][a-z0-9.\-]{2,39}$/;

export function createUserService({ repos, clock, logger }: ServiceDeps) {
  return {
    /** Synthetic sign-in by username (demo scope; production would use the corporate IdP). */
    signIn(username: unknown): User {
      const e = new FieldErrors();
      e.check(typeof username === 'string' && username.length > 0, 'username', 'is required');
      e.throwIfAny();
      const user = repos.users.findByUsername(username as string);
      if (!user || !user.active) throw new UnauthorizedError('Unknown or inactive user');
      logger.info('auth.signed_in', { userId: user.id, role: user.role });
      return user;
    },

    actorFor(userId: number): Actor | null {
      const u = repos.users.findById(userId);
      return u && u.active ? { id: u.id, role: u.role, username: u.username } : null;
    },

    create(actor: Actor, input: Record<string, unknown>): User {
      assertCan(actor, 'users.manage');
      const e = new FieldErrors();
      e.check(typeof input.username === 'string' && USERNAME.test(input.username), 'username', 'must be 3-40 lower-case letters, digits, dots or dashes, starting with a letter');
      e.check(typeof input.displayName === 'string' && input.displayName.trim().length >= 2 && input.displayName.trim().length <= 80, 'displayName', 'must be 2-80 characters');
      e.check(isRole(input.role), 'role', `must be one of ${ROLES.join(', ')}`);
      e.throwIfAny();
      if (repos.users.findByUsername(input.username as string)) throw new ConflictError(`Username ${input.username} already exists`);
      const user = repos.users.insert({
        username: input.username as string,
        displayName: (input.displayName as string).trim(),
        role: input.role as Role,
        createdAt: clock.now().toISOString(),
      });
      logger.info('user.created', { userId: user.id, role: user.role, by: actor.id });
      return user;
    },

    /** People move teams; assignments stay with the person (admin-console rule 2). */
    changeRole(actor: Actor, userId: number, role: unknown): User {
      assertCan(actor, 'users.manage');
      if (!isRole(role)) throw new ValidationError({ role: `must be one of ${ROLES.join(', ')}` });
      const user = repos.users.findById(userId);
      if (!user) throw new NotFoundError(`User ${userId} not found`);
      repos.users.setRole(userId, role);
      logger.info('user.role_changed', { userId, from: user.role, to: role, by: actor.id });
      return repos.users.findById(userId)!;
    },

    listAll(actor: Actor): User[] {
      assertCan(actor, 'users.manage');
      return repos.users.list();
    },

    /** Auditors need the owner list to assign findings. */
    listByRole(actor: Actor, role: Role): User[] {
      if (actor.role !== 'ADMIN') assertCan(actor, 'findings.record');
      return repos.users.list({ role }).filter((u) => u.active);
    },
  };
}
export type UserService = ReturnType<typeof createUserService>;
