import { afterEach, describe, expect, it } from 'vitest';
import { reloadConfig } from '@config/zamaro';
import { api } from '../../support/app';
import { expectContract } from '../../support/contract';

const FEATURES = { method: 'get', path: '/features' };

/**
 * Feature flags (ADR-0012): unfinished features stay off until an environment turns them on.
 */
describe('feature flags', () => {
  afterEach(() => {
    process.env.ZAMARO_FEATURE_BOOKING_REQUESTS = '';
    reloadConfig();
  });

  it('keeps booking requests off until an environment turns them on', async () => {
    const response = await api('/api/v1/features');

    expect(response.status).toBe(200);
    const body: unknown = await response.json();
    expect(body).toEqual({ data: { bookingRequests: false } });
    expect(response.headers.get('cache-control')).toContain('public');
    expectContract(response, FEATURES, body);
  });

  it('lets an environment turn a flag on by configuration', async () => {
    process.env.ZAMARO_FEATURE_BOOKING_REQUESTS = 'true';
    reloadConfig();

    const response = await api('/api/v1/features');

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: { bookingRequests: true } });
  });
});
