import type { Clock } from '../infrastructure/clock';
import type { Database } from '../infrastructure/db';
import type { Logger } from '../infrastructure/logging/logger';
import type { Repositories } from '../repositories';

/** Everything a service needs; built once in app.ts. */
export interface ServiceDeps {
  db: Database;
  clock: Clock;
  logger: Logger;
  repos: Repositories;
}
