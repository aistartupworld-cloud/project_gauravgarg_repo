---
name: archtest-author
description: Turn an agreed architectural rule into an executable test under tests/architecture and a dependency-cruiser rule (NFR-08, layering). Use when a reviewer or post-mortem names a structural rule.
---
# Archtest author

Template:
```ts
it('[NFR-08] <rule in one line>', () => {
  const offenders = sourceFiles('server/src/<layer>').filter(f => /* rule violated */);
  expect(offenders, 'files breaking the rule').toEqual([]);
});
```
- Use `tests/architecture/support.ts` (`sourceFiles`, `importsOf`).
- Import-direction rules also go in `.dependency-cruiser.cjs` `forbidden` with a clear `comment`.
- Run `npm run test:arch`.
