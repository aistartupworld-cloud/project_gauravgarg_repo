import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/{unit,api,architecture}/**/*.test.ts'],
    environment: 'node',
    pool: 'forks',
    testTimeout: 15_000,
    coverage: {
      provider: 'v8',
      include: ['server/src/**/*.ts'],
      exclude: ['server/src/main.ts', 'server/src/seed/**'],
      reporter: ['text-summary', 'text', 'lcov', 'cobertura', 'json-summary'],
      reportsDirectory: 'coverage',
      thresholds: { lines: 85, branches: 75, functions: 85, statements: 85 },
    },
  },
});
