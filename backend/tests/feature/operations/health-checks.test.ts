import { afterEach, describe, expect, it } from 'vitest';
import type { HealthCheck } from '@/server/contracts/health-check';
import { useHealthChecks } from '@/server/services/operations/readiness';
import { api } from '../../support/app';

const answers = (name: HealthCheck['name']): HealthCheck => ({
  name,
  run: () => Promise.resolve(),
});
const refuses = (name: HealthCheck['name']): HealthCheck => ({
  name,
  run: () => Promise.reject(new Error('connection refused')),
});

/**
 * L2-090.2: liveness and readiness probes. The dependency checks are a port (ADR-0028): the tests
 * bind checks that answer or refuse by name.
 */
describe('health checks', () => {
  afterEach(() => {
    useHealthChecks(undefined);
  });

  it('live returns 200 while the process runs', async () => {
    const response = await api('/health/live');

    expect(response.status).toBe(200);
  });

  it('ready returns 200 when every dependency answers', async () => {
    useHealthChecks([answers('database'), answers('cache'), answers('queue')]);

    const response = await api('/health/ready');

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'ready' });
  });

  it.each(['cache', 'queue', 'database'] as const)(
    'ready returns 503 naming the %s when it is unreachable',
    async (name) => {
      useHealthChecks(
        (['database', 'cache', 'queue'] as const).map((check) =>
          check === name ? refuses(check) : answers(check),
        ),
      );

      const response = await api('/health/ready');

      expect(response.status).toBe(503);
      expect(await response.json()).toEqual({ status: 'not ready', failed: [name] });
    },
  );
});
