import { AsyncLocalStorage } from 'node:async_hooks';

/** Per-request logging context (NFR-06). Services add auditId/findingId; the request log line picks them up. */
export interface LogContext {
  correlationId: string;
  auditId?: string;
  findingId?: string;
}

const storage = new AsyncLocalStorage<LogContext>();

export function runWithLogContext<T>(ctx: LogContext, fn: () => T): T {
  return storage.run(ctx, fn);
}

export function currentLogContext(): LogContext | undefined {
  return storage.getStore();
}

export function annotateLogContext(fields: { auditId?: string; findingId?: string }): void {
  const ctx = storage.getStore();
  if (!ctx) return;
  if (fields.auditId) ctx.auditId = fields.auditId;
  if (fields.findingId) ctx.findingId = fields.findingId;
}
