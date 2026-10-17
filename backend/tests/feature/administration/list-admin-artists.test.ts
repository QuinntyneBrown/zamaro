import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { Browser } from '../../support/accounts';
import { PRIYA_EMAIL, PRIYA_TOTP_SECRET, signInWithCode } from '../../support/admin';
import { resetClock } from '../../support/clock';
import { expectContract } from '../../support/contract';
import { closeDatabase, freshDatabase, query } from '../../support/database';

const ARTISTS = '/api/v1/admin/artists';
const INDEX = { method: 'get', path: '/admin/artists' };
const SHOW = { method: 'get', path: '/admin/artists/{artist}' };

interface Row {
  id: number;
  name: string;
  slug: string;
  actType: string;
  baseCity: string;
  rating: number | null;
  status: string;
}

interface List {
  data: Row[];
  meta: { total: number; approved: number; suspended: number };
}

/**
 * L2-067 (list entry, M3 D18): the read-only Artists list and detail an administrator reads before
 * suspend-and-reinstate (M8) adds its actions.
 */
describe('the admin artists list', () => {
  let priya: Browser;

  beforeAll(async () => {
    await freshDatabase();
  });

  afterAll(closeDatabase);

  beforeEach(async () => {
    await freshDatabase();
    resetClock();
    priya = await signInWithCode(PRIYA_EMAIL, PRIYA_TOTP_SECRET);
  });

  it('lists every approved and suspended artist A to Z with the counts', async () => {
    const response = await priya.json(ARTISTS, 'GET');

    expect(response.status).toBe(200);
    const body = (await response.json()) as List;
    expectContract(response, INDEX, body);
    const [counts] = await query<{ total: number; approved: number; suspended: number }>(
      sql`select count(*)::int as total,
                 count(*) filter (where status = 'approved')::int as approved,
                 count(*) filter (where status = 'suspended')::int as suspended
          from artists`,
    );
    expect(body.meta).toEqual(counts);
    expect(body.meta.suspended).toBe(1);
    expect(body.data).toHaveLength(counts?.total ?? -1);
    const mockCast = [
      'Abigail Mensah',
      'Daniel & Ruth Okonkwo',
      'Elijah Park',
      'Grace Tabernacle Mass Choir',
      'Hosanna Collective',
      'Luz Viva',
      'Marcus Bell Trio',
      'Miriam Haile',
      'Selah Brooks',
    ];
    expect(body.data.map((row) => row.name).filter((name) => mockCast.includes(name))).toEqual(
      mockCast,
    );
    const abigail = body.data.find((row) => row.name === 'Abigail Mensah');
    expect(abigail?.actType).toBe('solo');
    expect(abigail?.baseCity).toBe('Brampton');
    expect(abigail?.rating).toBe(4.9);
    expect(abigail?.status).toBe('approved');
    expect(body.data.find((row) => row.name === 'Miriam Haile')?.rating).toBeNull();
    expect(body.data.find((row) => row.name === 'Selah Brooks')?.status).toBe('suspended');
  });

  it('matches the search on name, city or email, and an applicant is not an artist', async () => {
    expect((await list('?q=Tobi')).data).toEqual([]);
    const hamilton = (await list('?q=hamilton')).data;
    expect(hamilton.map((row) => row.name)).toContain('Marcus Bell Trio');
    for (const row of hamilton) {
      expect(`${row.name} ${row.baseCity}`.toLowerCase(), row.name).toContain('hamilton');
    }
    expect((await list('?q=marcus@marcusbelltrio.ca')).data.map((row) => row.name)).toEqual([
      'Marcus Bell Trio',
    ]);
    expect((await list('?q=okonkwo')).data.map((row) => row.name)).toEqual([
      'Daniel & Ruth Okonkwo',
    ]);
  });

  it("shows an artist's account, profile, upcoming bookings and standing", async () => {
    const [marcus] = await query<{ id: number }>(
      sql`select id from artists where slug = 'marcus-bell-trio'`,
    );

    const response = await priya.json(`${ARTISTS}/${String(marcus?.id ?? 0)}`, 'GET');

    expect(response.status).toBe(200);
    const body = (await response.json()) as { data: Record<string, unknown> };
    expectContract(response, SHOW, body);
    expect(body.data).toMatchObject({
      name: 'Marcus Bell Trio',
      email: 'marcus@marcusbelltrio.ca',
      actType: 'band',
      styles: ['band', 'acoustic', 'hymns'],
      baseCity: 'Hamilton',
      fromPriceCents: 95000,
      rating: 4.6,
      slug: 'marcus-bell-trio',
      status: 'approved',
      suspensions: [],
    });
    expect(new Date(body.data.approvedAt as string).toISOString()).toBe('2026-03-02T14:00:00.000Z');
    const [first] = body.data.upcomingBookings as Record<string, unknown>[];
    expect(first).toEqual({
      number: 'ZAM-0097',
      eventDate: '2026-10-25',
      churchName: 'Riverside Community Church',
      churchCity: 'Burlington',
      kind: 'sunday-service',
      status: 'confirmed',
    });
    expect((await priya.json(`${ARTISTS}/999999`, 'GET')).status).toBe(404);
  });

  async function list(queryString: string): Promise<List> {
    const response = await priya.json(`${ARTISTS}${queryString}`, 'GET');
    expect(response.status, queryString).toBe(200);
    return (await response.json()) as List;
  }
});
