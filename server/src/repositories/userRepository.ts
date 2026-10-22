import type { Database } from '../infrastructure/db';
import type { Role, User } from '../domain/types';
import { num, str, type Row } from './rows';

export interface NewUser {
  username: string;
  displayName: string;
  role: Role;
  createdAt: string;
}

const toUser = (r: Row): User => ({
  id: num(r, 'id'),
  username: str(r, 'username'),
  displayName: str(r, 'display_name'),
  role: str(r, 'role') as Role,
  active: num(r, 'active') === 1,
  createdAt: str(r, 'created_at'),
});

export function createUserRepository(db: Database) {
  return {
    insert(u: NewUser): User {
      const res = db
        .prepare('INSERT INTO users (username, display_name, role, created_at) VALUES (?, ?, ?, ?)')
        .run(u.username, u.displayName, u.role, u.createdAt);
      return this.findById(Number(res.lastInsertRowid))!;
    },
    findById(id: number): User | null {
      const r = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as Row | undefined;
      return r ? toUser(r) : null;
    },
    findByUsername(username: string): User | null {
      const r = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as Row | undefined;
      return r ? toUser(r) : null;
    },
    list(filter: { role?: Role } = {}): User[] {
      const rows = filter.role
        ? db.prepare('SELECT * FROM users WHERE role = ? ORDER BY username').all(filter.role)
        : db.prepare('SELECT * FROM users ORDER BY role, username').all();
      return (rows as Row[]).map(toUser);
    },
    setRole(id: number, role: Role): void {
      db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, id);
    },
    count(): number {
      return num(db.prepare('SELECT COUNT(*) AS n FROM users').get() as Row, 'n');
    },
  };
}
export type UserRepository = ReturnType<typeof createUserRepository>;
