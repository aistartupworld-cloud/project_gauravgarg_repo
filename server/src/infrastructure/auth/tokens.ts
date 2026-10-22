import { createHmac, timingSafeEqual } from 'node:crypto';
import type { Role } from '../../domain/types';

export const TOKEN_TTL_SECONDS = 8 * 60 * 60;

export interface TokenClaims {
  sub: number;
  role: Role;
  username: string;
}

interface Payload extends TokenClaims {
  iat: number;
  exp: number;
}

const b64 = (buf: Buffer | string) => Buffer.from(buf).toString('base64url');

function sign(data: string, secret: string): string {
  return createHmac('sha256', secret).update(data).digest('base64url');
}

/** HMAC-SHA256 signed token: base64url(payload).signature. Synthetic auth for the demo scope. */
export function signToken(claims: TokenClaims, secret: string, issuedAt: Date): string {
  const iat = Math.floor(issuedAt.getTime() / 1000);
  const payload: Payload = { ...claims, iat, exp: iat + TOKEN_TTL_SECONDS };
  const body = b64(JSON.stringify(payload));
  return `${body}.${sign(body, secret)}`;
}

/** Returns claims when the signature is valid and the token is unexpired, otherwise null. */
export function verifyToken(token: string, secret: string, now: Date): TokenClaims | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [body, sig] = parts as [string, string];
  const expected = Buffer.from(sign(body, secret));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as Payload;
    if (typeof p.exp !== 'number' || p.exp <= Math.floor(now.getTime() / 1000)) return null;
    if (!Number.isInteger(p.sub)) return null;
    return { sub: p.sub, role: p.role, username: p.username };
  } catch {
    return null;
  }
}
