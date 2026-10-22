import { annotateLogContext, currentLogContext } from './context';
import { maskSensitive } from './mask';

export const LEVELS = ['debug', 'info', 'warn', 'error', 'silent'] as const;
export type Level = (typeof LEVELS)[number];
const RANK: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40, silent: 100 };

export type Fields = Record<string, unknown>;

export interface Logger {
  debug(msg: string, fields?: Fields): void;
  info(msg: string, fields?: Fields): void;
  warn(msg: string, fields?: Fields): void;
  error(msg: string, fields?: Fields): void;
  child(bound: Fields): Logger;
}

export interface LoggerOptions {
  sink?: (line: string) => void;
  level?: Level;
  now?: () => Date;
}

/** Structured JSON logger with correlation ids and masking (NFR-03, NFR-06). */
export function createLogger(opts: LoggerOptions = {}, bound: Fields = {}): Logger {
  const sink = opts.sink ?? ((line: string) => process.stdout.write(line + '\n'));
  const threshold = RANK[opts.level ?? 'info'];
  const now = opts.now ?? (() => new Date());

  const write = (level: Exclude<Level, 'silent'>, msg: string, fields: Fields = {}) => {
    const merged = { ...bound, ...fields };
    if (typeof merged.auditId === 'string' || typeof merged.findingId === 'string') {
      annotateLogContext({ auditId: merged.auditId as string | undefined, findingId: merged.findingId as string | undefined });
    }
    if (RANK[level] < threshold) return;
    const ctx = currentLogContext();
    const record = { level, time: now().toISOString(), msg, ...(ctx ? { correlationId: ctx.correlationId } : {}), ...merged };
    sink(JSON.stringify(maskSensitive(record)));
  };

  return {
    debug: (m, f) => write('debug', m, f),
    info: (m, f) => write('info', m, f),
    warn: (m, f) => write('warn', m, f),
    error: (m, f) => write('error', m, f),
    child: (more) => createLogger(opts, { ...bound, ...more }),
  };
}

export interface MemorySink {
  write: (line: string) => void;
  raw: string[];
  readonly lines: Array<Record<string, unknown>>;
}

export function memorySink(): MemorySink {
  const raw: string[] = [];
  return {
    raw,
    write: (line) => raw.push(line),
    get lines() {
      return raw.map((l) => JSON.parse(l) as Record<string, unknown>);
    },
  };
}

export function parseLevel(value: string | undefined, fallback: Level = 'info'): Level {
  return (LEVELS as readonly string[]).includes(value ?? '') ? (value as Level) : fallback;
}
