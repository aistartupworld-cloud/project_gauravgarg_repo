import { describe, expect, it } from 'vitest';
import { codeOnly, importsOf, sourceFiles } from './support';

const layerOf = (spec: string) => /\/(domain|services|repositories|controllers|infrastructure)\//.exec(spec + '/')?.[1];

describe('[NFR-08] layered architecture (controllers → services → repositories → domain)', () => {
  it('[NFR-08] domain imports nothing outside domain (no I/O, no frameworks)', () => {
    const offenders = sourceFiles('server/src/domain').flatMap((f) =>
      importsOf(f)
        .filter((s) => !s.startsWith('./'))
        .map((s) => `${f} → ${s}`),
    );
    expect(offenders).toEqual([]);
  });

  it('[NFR-08] controllers never import repositories or the database', () => {
    const offenders = sourceFiles('server/src/controllers').flatMap((f) =>
      importsOf(f)
        .filter((s) => /repositories|infrastructure\/db|node:sqlite/.test(s))
        .map((s) => `${f} → ${s}`),
    );
    expect(offenders).toEqual([]);
  });

  it('[NFR-08] repositories never import services or controllers', () => {
    const offenders = sourceFiles('server/src/repositories').flatMap((f) =>
      importsOf(f)
        .filter((s) => ['services', 'controllers'].includes(layerOf(s) ?? ''))
        .map((s) => `${f} → ${s}`),
    );
    expect(offenders).toEqual([]);
  });

  it('[NFR-08] services never import controllers or express', () => {
    const offenders = sourceFiles('server/src/services').flatMap((f) =>
      importsOf(f)
        .filter((s) => layerOf(s) === 'controllers' || s === 'express')
        .map((s) => `${f} → ${s}`),
    );
    expect(offenders).toEqual([]);
  });

  it('[NFR-04] every route declaration names its roles at the controller layer', () => {
    const offenders: string[] = [];
    for (const f of sourceFiles('server/src/controllers')) {
      codeOnly(f)
        .split('\n')
        .forEach((line, i) => {
          if (/router\.(get|post|put|patch|delete)\(/.test(line) && !/requireRole\(|publicRoute/.test(line)) {
            offenders.push(`${f}:${i + 1}`);
          }
        });
    }
    expect(offenders).toEqual([]);
  });

  it('[NFR-08] the web client never imports server code', () => {
    const offenders = sourceFiles('web/src').flatMap((f) =>
      importsOf(f)
        .filter((s) => s.includes('server/'))
        .map((s) => `${f} → ${s}`),
    );
    expect(offenders).toEqual([]);
  });
});
