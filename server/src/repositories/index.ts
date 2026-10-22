import type { Database } from '../infrastructure/db';
import { createAuditRepository } from './auditRepository';
import { createControlRepository } from './controlRepository';
import { createFindingRepository } from './findingRepository';
import { createSlaRepository } from './slaRepository';
import { createUserRepository } from './userRepository';

export function createRepositories(db: Database) {
  return {
    users: createUserRepository(db),
    controls: createControlRepository(db),
    audits: createAuditRepository(db),
    sla: createSlaRepository(db),
    findings: createFindingRepository(db),
  };
}
export type Repositories = ReturnType<typeof createRepositories>;
