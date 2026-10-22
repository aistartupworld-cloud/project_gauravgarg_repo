import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import type { Logger } from '../logging/logger';
import { currentLogContext, runWithLogContext } from '../logging/context';

const SAFE_ID = /^[A-Za-z0-9._\-]{1,100}$/;

/** Assigns a correlation id, runs the request inside a log context and writes one JSON line on finish (NFR-06). */
export function requestContext(logger: Logger) {
  return (req: Request, res: Response, next: NextFunction) => {
    const incoming = req.header('x-correlation-id');
    const correlationId = incoming && SAFE_ID.test(incoming) ? incoming : randomUUID();
    res.setHeader('X-Correlation-Id', correlationId);
    const started = performance.now();
    runWithLogContext({ correlationId }, () => {
      const ctx = currentLogContext()!;
      res.on('finish', () => {
        runWithLogContext(ctx, () => {
          logger.info('request', {
            method: req.method,
            path: req.path,
            status: res.statusCode,
            durationMs: Math.round(performance.now() - started),
            ...(ctx.auditId ? { auditId: ctx.auditId } : {}),
            ...(ctx.findingId ? { findingId: ctx.findingId } : {}),
          });
        });
      });
      next();
    });
  };
}
