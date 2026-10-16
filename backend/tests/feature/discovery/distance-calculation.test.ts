import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { RoutingUnavailable } from '@/server/contracts/routing-provider';
import { useCache } from '@/server/integrations/bindings';
import { useRoutingProvider } from '@/server/integrations/bindings';
import { closeDatabase, freshDatabase } from '../../support/database';
import { lineup, routing } from '../../support/discovery';
import { captureLogs } from '../../support/logs';
import { resetClock, travel } from '../../support/clock';

/**
 * L2-002.2-3: road distances are cached for 30 days; when routing is unavailable the search still
 * runs on straight-line distance x 1.3, marked approximate, and that estimate is not cached.
 */
describe('distance calculation', () => {
  let logs: ReturnType<typeof captureLogs>;

  beforeAll(async () => {
    await freshDatabase();
    logs = captureLogs();
  });

  afterAll(async () => {
    logs.restore();
    await closeDatabase();
  });

  beforeEach(() => {
    // A fresh router and an empty distance cache for every test.
    useRoutingProvider(undefined);
    useCache(undefined);
    resetClock();
  });

  it('reuses the cached distances on a repeated search', async () => {
    await lineup();
    const callsAfterFirstSearch = routing().calls();

    const page = await lineup();

    expect(page.headliner?.distance.km).toBe(44);
    expect(callsAfterFirstSearch).toBeGreaterThan(0);
    expect(routing().calls()).toBe(callsAfterFirstSearch);
  });

  it('lets cached distances expire after thirty days', async () => {
    await lineup();
    const calls = routing().calls();

    travel({ days: 31 });
    await lineup();

    expect(routing().calls()).toBeGreaterThan(calls);
  });

  it('uses approximate straight-line distances when routing fails', async () => {
    routing().failWith(new RoutingUnavailable('Timed out after 2 s'));

    const page = await lineup();

    expect(page.headliner?.name).toBe('Abigail Mensah');
    expect(page.headliner?.distance).toEqual({ km: 59, driveMinutes: 45, approximate: true });
    expect(page.data.map((card) => card.name)).toEqual([
      'Marcus Bell Trio',
      'Hosanna Collective',
      'Luz Viva',
      'Grace Tabernacle Mass Choir',
      'Elijah Park',
      'Daniel & Ruth Okonkwo',
    ]);
    expect(page.data.map((card) => card.distance.km)).toEqual([13, 41, 75, 88, 91, 111]);
    expect(page.data.every((card) => card.distance.approximate)).toBe(true);
    expect(
      logs.lines().some((line) => line.msg === 'routing.unavailable' && line.level === 40),
    ).toBe(true);
  });

  it('does not cache approximate distances', async () => {
    routing().failWith(new RoutingUnavailable('Timed out after 2 s'));
    await lineup();

    routing().recover();
    const page = await lineup();

    expect(page.headliner?.name).toBe('Abigail Mensah');
    expect(page.headliner?.distance).toEqual({ km: 44, driveMinutes: 35, approximate: false });
  });
});
