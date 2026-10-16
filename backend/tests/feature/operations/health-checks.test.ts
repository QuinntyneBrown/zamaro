import { describe, expect, it } from 'vitest';
import { api } from '../../support/api';
import { startApi } from '../../support/api-process';

/**
 * L2-090.2: liveness and readiness probes.
 */
describe('health checks', () => {
  it('live returns 200 while the process runs', async () => {
    const response = await api('/health/live');

    expect(response.status).toBe(200);
  });

  it('ready returns 200 when every dependency answers', async () => {
    const response = await api('/health/ready');

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'ready' });
  });

  it.each([
    ['cache', { REDIS_CACHE_URL: 'redis://127.0.0.1:1/0' }],
    ['queue', { REDIS_QUEUE_URL: 'redis://127.0.0.1:1/0' }],
    ['database', { DATABASE_URL: 'postgres://zamaro:zamaro@127.0.0.1:1/zamaro_test' }],
  ])('ready returns 503 naming the %s when it is unreachable', async (name, overrides) => {
    const unreachable = await startApi(overrides, `no-${name}`);
    try {
      const response = await api('/health/ready', {}, unreachable.url);

      expect(response.status).toBe(503);
      expect(await response.json()).toEqual({ status: 'not ready', failed: [name] });
    } finally {
      await unreachable.stop();
    }
  });
});
