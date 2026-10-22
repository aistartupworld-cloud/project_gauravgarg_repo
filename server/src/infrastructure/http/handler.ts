import type { NextFunction, Request, Response } from 'express';

/** Wraps a handler so thrown errors (sync or async) reach the error middleware. */
export function handle(fn: (req: Request, res: Response) => unknown) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const out = fn(req, res);
      if (out instanceof Promise) out.catch(next);
    } catch (err) {
      next(err);
    }
  };
}

export function body(req: Request): Record<string, unknown> {
  return req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? (req.body as Record<string, unknown>) : {};
}

export function queryString(req: Request, key: string): string | undefined {
  const v = req.query[key];
  return typeof v === 'string' && v.length > 0 ? v : undefined;
}

export function intParam(req: Request, key: string): number {
  const n = Number(req.params[key]);
  return Number.isSafeInteger(n) && n > 0 ? n : -1;
}
