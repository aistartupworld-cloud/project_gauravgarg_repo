import type { AuthGuards } from '../infrastructure/http/auth';

export interface ControllerDeps {
  auth: AuthGuards;
}
