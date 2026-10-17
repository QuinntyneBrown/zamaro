import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { ABIGAIL, Browser, freshBooker, NAOMI, signedIn } from '../../support/accounts';
import { resetClock } from '../../support/clock';
import { expectContract } from '../../support/contract';
import { closeDatabase, freshDatabase, query } from '../../support/database';

const SHOW = { method: 'get', path: '/account/church' };
const SAVE = { method: 'put', path: '/account/church' };
const ME = { method: 'get', path: '/me' };

const RIVERSIDE = {
  name: 'Riverside Community Church',
  streetAddress: '2150 Lakeshore Road',
  city: 'Burlington',
  postalCode: 'L7R 1A3',
  phone: '905-555-0123',
  denomination: 'Non-denominational',
  typicalAttendance: 350,
};

interface ChurchRow extends Record<string, unknown> {
  latitude: number;
  longitude: number;
  postal_code: string;
  phone: string;
}

/**
 * L2-024 and L2-001 (accounts/manage-church-profile): a booker keeps one church. Its address is
 * geocoded and checked against the 200 km service area before anything is stored, and its phone is a
 * North American number, encrypted at rest (L2-079.2).
 */
describe('the church profile', () => {
  beforeAll(async () => {
    await freshDatabase();
  });

  afterAll(closeDatabase);

  beforeEach(async () => {
    await freshDatabase();
    resetClock();
  });

  it('shows Naomi her church', async () => {
    const browser = await signedIn(NAOMI);

    const response = await browser.json('/api/v1/account/church', 'GET');

    expect(response.status).toBe(200);
    const body = (await response.json()) as { data: Record<string, unknown> };
    expect(body.data).toEqual({
      name: 'Riverside Community Church',
      streetAddress: '2150 Lakeshore Road',
      city: 'Burlington',
      province: 'ON',
      postalCode: 'L7R 1A3',
      phone: '905-555-0123',
      denomination: 'Non-denominational',
      typicalAttendance: 350,
    });
    expect(response.headers.get('cache-control')).toContain('no-store');
    expectContract(response, SHOW, body);
  });

  it('shows a booker without a church none', async () => {
    const browser = await signedIn(await freshBooker());

    const response = await browser.json('/api/v1/account/church', 'GET');

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: null });
  });

  it('geocodes and saves a Burlington address', async () => {
    const email = await freshBooker();
    const browser = await signedIn(email);

    const response = await save(browser, RIVERSIDE);

    expect(response.status).toBe(200);
    const body = (await response.json()) as { data: { city: string; phone: string } };
    expect(body.data.city).toBe('Burlington');
    expect(body.data.phone).toBe('905-555-0123');
    expectContract(response, SAVE, body);
    const row = await churchOf(email);
    expect(row?.latitude).toBeCloseTo(43.325, 2);
    expect(row?.longitude).toBeCloseTo(-79.799, 2);
    expect(row?.postal_code).toBe('L7R 1A3');
  });

  it('replaces the one church when saved again', async () => {
    const browser = await signedIn(NAOMI);

    const response = await save(browser, { ...RIVERSIDE, typicalAttendance: 400 });

    expect(response.status).toBe(200);
    expect(
      ((await response.json()) as { data: { typicalAttendance: number } }).data.typicalAttendance,
    ).toBe(400);
    expect(
      await query(
        sql`select c.id from churches c join users u on u.id = c.booker_id where u.email = ${NAOMI}`,
      ),
    ).toHaveLength(1);
  });

  it('stores the phone encrypted and reads it back plain', async () => {
    const browser = await signedIn(NAOMI);

    const response = await save(browser, { ...RIVERSIDE, phone: '(905) 555 0199' });

    expect(response.status).toBe(200);
    expect(((await response.json()) as { data: { phone: string } }).data.phone).toBe(
      '905-555-0199',
    );
    const row = await churchOf(NAOMI);
    expect(row?.phone.startsWith('v1:')).toBe(true);
    expect(row?.phone).not.toContain('555');
  });

  it('refuses an Ottawa address as outside the service area and stores nothing', async () => {
    const browser = await signedIn(NAOMI);
    const before = await churchOf(NAOMI);

    const response = await save(browser, {
      ...RIVERSIDE,
      streetAddress: '180 Elgin Street',
      city: 'Ottawa',
      postalCode: 'K2P 2K3',
    });

    expect(response.status).toBe(422);
    const body = (await response.json()) as { errors: Record<string, string[]> };
    expect(body.errors.serviceArea?.[0]).toBe('Zamaro serves churches within 200 km of Toronto.');
    expectContract(response, SAVE, body);
    expect(await churchOf(NAOMI)).toEqual(before);
  });

  it('refuses an address that cannot be found and stores nothing', async () => {
    const email = await freshBooker();
    const browser = await signedIn(email);

    const response = await save(browser, { ...RIVERSIDE, streetAddress: '1 Nowhere Lane' });

    expect(response.status).toBe(422);
    const body = (await response.json()) as { errors: Record<string, string[]> };
    expect(body.errors.streetAddress?.[0]).toBe(
      'We couldn’t find that address. Check the street and postal code.',
    );
    expect(await churchOf(email)).toBeUndefined();
  });

  it('checks each field before the address is looked up', async () => {
    const browser = await signedIn(NAOMI);
    const cases: [string, unknown, string][] = [
      ['postalCode', 'L7R 1A', 'Enter a postal code like L7R 1A3, with six characters.'],
      ['name', 'R', 'Use 2 to 120 characters for the church name.'],
      ['phone', '555-0123', 'Enter a North American phone number, like 905-555-0123.'],
      ['typicalAttendance', 0, 'Enter the typical attendance as a whole number above 0.'],
    ];

    for (const [field, value, message] of cases) {
      const response = await save(browser, { ...RIVERSIDE, [field]: value });
      expect(response.status, field).toBe(422);
      const body = (await response.json()) as { errors: Record<string, string[]> };
      expect(body.errors[field]?.[0], field).toBe(message);
    }
    const longName = await save(browser, { ...RIVERSIDE, name: 'a'.repeat(121) });
    expect(longName.status).toBe(422);
    expect(((await longName.json()) as { errors: object }).errors).toHaveProperty('name');
    const blank = await save(browser, { ...RIVERSIDE, streetAddress: '', city: '' });
    expect(blank.status).toBe(422);
    const errors = ((await blank.json()) as { errors: object }).errors;
    expect(errors).toHaveProperty('streetAddress');
    expect(errors).toHaveProperty('city');
  });

  it('makes denomination and attendance optional and tidies a lower-case postal code', async () => {
    const browser = await signedIn(NAOMI);

    const response = await save(browser, {
      ...RIVERSIDE,
      denomination: null,
      typicalAttendance: null,
      postalCode: 'l7r1a3',
    });

    expect(response.status).toBe(200);
    const body = (await response.json()) as { data: Record<string, unknown> };
    expect(body.data.denomination).toBeNull();
    expect(body.data.typicalAttendance).toBeNull();
    expect(body.data.postalCode).toBe('L7R 1A3');
  });

  it('gives the header and Discover the church through me', async () => {
    const browser = await signedIn(NAOMI);

    const response = await browser.json('/api/v1/me', 'GET');

    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      data: { church: { name: string; city: string; latitude: number } };
    };
    expect(body.data.church.name).toBe('Riverside Community Church');
    expect(body.data.church.city).toBe('Burlington');
    expect(body.data.church.latitude).toBeCloseTo(43.325, 2);
    expectContract(response, ME, body);
  });

  it('gives an artist no church route', async () => {
    const browser = await signedIn(ABIGAIL);

    expect((await browser.json('/api/v1/account/church', 'GET')).status).toBe(404);
    expect((await save(browser, RIVERSIDE)).status).toBe(404);
  });

  it('gives a guest 401', async () => {
    const browser = new Browser();

    expect((await browser.json('/api/v1/account/church', 'GET')).status).toBe(401);
  });

  function save(browser: Browser, church: Record<string, unknown>): Promise<Response> {
    return browser.json('/api/v1/account/church', 'PUT', church);
  }

  async function churchOf(email: string): Promise<ChurchRow | undefined> {
    const [row] = await query<ChurchRow>(
      sql`select c.latitude::float as latitude, c.longitude::float as longitude, c.postal_code, c.phone
          from churches c join users u on u.id = c.booker_id where u.email = ${email}`,
    );
    return row;
  }
});
