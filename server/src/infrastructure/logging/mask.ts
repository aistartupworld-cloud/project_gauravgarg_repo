/**
 * Masks sensitive system details before anything is logged (NFR-03).
 * Order matters: credentials first (they may contain hosts), then asset ids, IPs, hostnames.
 */
const RULES: Array<[RegExp, string]> = [
  // credential references: key=value / key: value pairs, vault paths, AWS secrets ARNs
  [/\b(?:password|passwd|pwd|secret|token|api[_-]?key|access[_-]?key)\s*[:=]\s*\S+/gi, '[credential]'],
  [/\bvault:[^\s,;)]+/gi, '[credential]'],
  [/\barn:aws:secretsmanager:[^\s,;)]+/gi, '[credential]'],
  // asset identifiers
  [/\bASSET-\d+\b/g, '[asset]'],
  // IPv4
  [/\b(?:25[0-5]|2[0-4]\d|1?\d?\d)(?:\.(?:25[0-5]|2[0-4]\d|1?\d?\d)){3}\b/g, '[ip]'],
  // IPv6: either compressed (contains '::') or full (7 colons); clock times like 09:00:00 do not match
  [/(?<![\w:.])(?=[0-9a-f:]*::|(?:[0-9a-f]{1,4}:){7})[0-9a-f]{0,4}(?::[0-9a-f]{0,4}){2,7}(?![\w:])/gi, '[ip]'],
  // hostnames / FQDNs: label(.label)+.tld where tld is alphabetic (excludes control ids like A.5.1)
  [/\b(?=[a-z0-9-]*[a-z])[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*\.(?:internal|corp|local|lan|com|net|org|io|cloud|example)\b/gi, '[host]'],
];

function maskString(value: string): string {
  return RULES.reduce((s, [re, replacement]) => s.replace(re, replacement), value);
}

/** Returns a masked deep copy of strings, arrays and plain objects. Other values pass through. */
export function maskSensitive<T>(value: T): T {
  if (typeof value === 'string') return maskString(value) as T;
  if (Array.isArray(value)) return value.map((v) => maskSensitive(v)) as T;
  if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = maskSensitive(v);
    return out as T;
  }
  return value;
}
