/**
 * Acceptance-criteria trace: every AC-NN / NFR-NN declared in specs/ must be referenced by at least one test name.
 * Usage: tsx scripts/ac-trace.ts [--quiet] [--json]
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const ID = /\b(AC|NFR)-\d{2}\b/g;

function walk(dir: string, filter: (f: string) => boolean): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p, filter));
    else if (filter(p)) out.push(p);
  }
  return out;
}

const specFiles = walk(join(ROOT, 'specs'), (f) => f.endsWith('_spec.md'));
const declared = new Map<string, string>();
for (const file of specFiles) {
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const m = /^#{2,4}\s+((?:AC|NFR)-\d{2})\b/.exec(line);
    if (m && !declared.has(m[1]!)) declared.set(m[1]!, file.replace(ROOT + '/', ''));
  }
}

const testFiles = walk(join(ROOT, 'tests'), (f) => /\.(test|spec)\.tsx?$/.test(f));
const covered = new Map<string, Set<string>>();
for (const file of testFiles) {
  const src = readFileSync(file, 'utf8');
  // Only count tags inside test titles: it('[AC-05] ...') / test('[NFR-01] ...') / describe('[AC-03] ...')
  const titles = src.match(/\b(?:it|test|describe)(?:\.each\([^)]*\))?\(\s*[`'"][^`'"]*[`'"]/g) ?? [];
  for (const t of titles) {
    for (const id of t.match(ID) ?? []) {
      if (!covered.has(id)) covered.set(id, new Set());
      covered.get(id)!.add(file.replace(ROOT + '/', ''));
    }
  }
}

const rows = [...declared.keys()].sort().map((id) => ({
  id,
  spec: declared.get(id)!,
  tests: [...(covered.get(id) ?? [])].sort(),
}));
const missing = rows.filter((r) => r.tests.length === 0);

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ rows, missing: missing.map((m) => m.id) }, null, 2));
} else if (!process.argv.includes('--quiet') || missing.length) {
  for (const r of rows) {
    const mark = r.tests.length ? 'OK  ' : 'MISS';
    console.log(`${mark} ${r.id.padEnd(7)} ${String(r.tests.length).padStart(2)} test file(s)  ${r.spec}`);
  }
  console.log(`\n${rows.length - missing.length}/${rows.length} criteria traced to tests.`);
}
process.exit(missing.length ? 1 : 0);
