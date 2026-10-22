import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { makeFixture } from '../helpers/fixture';

describe('[NFR-07] health endpoint', () => {
  it('[NFR-07] returns 200 {status:"ok"}', async () => {
    const f = makeFixture();
    const res = await f.api.get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ok' });
  });

  it('[NFR-07] answers within 1 second of the real server reporting it is listening', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'securegate-health-'));
    const port = 3900 + Math.floor(Math.random() * 90);
    const child = spawn(process.execPath, ['--import', 'tsx', 'server/src/main.ts'], {
      env: { ...process.env, PORT: String(port), DB_PATH: join(dir, 'h.db'), SERVE_WEB: 'false', LOG_LEVEL: 'info' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    try {
      const listeningAt = await new Promise<number>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('server did not start in 20s')), 20_000);
        child.stdout.on('data', (chunk: Buffer) => {
          if (chunk.toString().includes('"msg":"server.listening"')) {
            clearTimeout(timer);
            resolve(performance.now());
          }
        });
        child.on('exit', (code) => reject(new Error(`server exited ${code}`)));
      });
      const res = await fetch(`http://127.0.0.1:${port}/health`);
      const elapsed = performance.now() - listeningAt;
      expect(res.status).toBe(200);
      expect(elapsed).toBeLessThan(1000);
    } finally {
      child.kill();
      rmSync(dir, { recursive: true, force: true });
    }
  }, 30_000);
});
