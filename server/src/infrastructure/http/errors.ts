import type { NextFunction, Request, Response } from 'express';
import { DomainError, ValidationError } from '../../domain/errors';
import type { Logger } from '../logging/logger';

const STATUS: Record<string, number> = {
  VALIDATION_FAILED: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  SOD_VIOLATION: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INVALID_AUDIT_STATE: 409,
  INVALID_FINDING_STATE: 409,
  IMMUTABLE_RECORD: 409,
};

/** Maps domain errors to HTTP responses: `{ error, code, message, fields? }`. Unknown errors become 500. */
export function errorHandler(logger: Logger) {
  return (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof DomainError) {
      const status = STATUS[err.code] ?? 400;
      res.status(status).json({
        error: err.name,
        code: err.code,
        message: err.message,
        ...(err instanceof ValidationError ? { fields: err.fields } : {}),
      });
      return;
    }
    if (err instanceof SyntaxError && 'body' in err) {
      res.status(400).json({ error: 'ValidationError', code: 'VALIDATION_FAILED', message: 'Malformed JSON body' });
      return;
    }
    logger.error('unhandled.error', { error: err instanceof Error ? err.message : String(err) });
    res.status(500).json({ error: 'InternalError', code: 'INTERNAL', message: 'Unexpected error' });
  };
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: 'NotFoundError', code: 'NOT_FOUND', message: 'No such route' });
}
