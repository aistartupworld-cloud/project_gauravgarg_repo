/** Layering rules (NFR-08). Mirrors tests/architecture/layering.test.ts so CI catches violations twice. */
module.exports = {
  forbidden: [
    {
      name: 'domain-is-pure',
      comment: 'server/src/domain holds pure business rules: it may import only other domain modules.',
      severity: 'error',
      from: { path: '^server/src/domain' },
      to: { pathNot: '^server/src/domain' },
    },
    {
      name: 'controllers-not-to-repositories',
      comment: 'Controllers talk to services only (auth boundary + use cases live there).',
      severity: 'error',
      from: { path: '^server/src/controllers' },
      to: { path: '^server/src/(repositories|infrastructure/db)' },
    },
    {
      name: 'repositories-not-upward',
      comment: 'Repositories must not depend on services or controllers.',
      severity: 'error',
      from: { path: '^server/src/repositories' },
      to: { path: '^server/src/(services|controllers)' },
    },
    {
      name: 'services-not-to-controllers',
      comment: 'Services must not depend on the HTTP layer.',
      severity: 'error',
      from: { path: '^server/src/services' },
      to: { path: '^(server/src/controllers|node_modules/express)' },
    },
    {
      name: 'infrastructure-not-upward',
      comment: 'Infrastructure may use domain types but not services, repositories or controllers.',
      severity: 'error',
      from: { path: '^server/src/infrastructure' },
      to: { path: '^server/src/(services|repositories|controllers)' },
    },
    {
      name: 'web-not-to-server',
      comment: 'The SPA talks to the server over HTTP only.',
      severity: 'error',
      from: { path: '^web/src' },
      to: { path: '^server/' },
    },
    {
      name: 'no-circular',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.json' },
    enhancedResolveOptions: { extensions: ['.ts', '.tsx', '.js'] },
  },
};
