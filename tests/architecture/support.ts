import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

export const ROOT = process.cwd();

export function sourceFiles(dir: string, ext = /\.tsx?$/): string[] {
  const abs = join(ROOT, dir);
  if (!existsSync(abs)) return [];
  const out: string[] = [];
  for (const name of readdirSync(abs)) {
    const p = join(abs, name);
    if (statSync(p).isDirectory()) out.push(...sourceFiles(relative(ROOT, p), ext));
    else if (ext.test(name)) out.push(relative(ROOT, p));
  }
  return out.sort();
}

export function read(file: string): string {
  return readFileSync(join(ROOT, file), 'utf8');
}

/** Module specifiers imported by a file (static imports and re-exports). */
export function importsOf(file: string): string[] {
  const src = read(file);
  const specs: string[] = [];
  for (const m of src.matchAll(/(?:import|export)\s[^'"]*?from\s+['"]([^'"]+)['"]/g)) specs.push(m[1]!);
  for (const m of src.matchAll(/import\(\s*['"]([^'"]+)['"]\s*\)/g)) specs.push(m[1]!);
  return specs;
}

/** Strip comments so rules about code don't trip on documentation. */
export function codeOnly(file: string): string {
  return read(file)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}
