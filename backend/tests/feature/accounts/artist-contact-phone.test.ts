import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { decryptField } from '@/server/support/encryption/field-cipher';
import { ABIGAIL, NAOMI, signedIn } from '../../support/accounts';
import { api } from '../../support/app';
import { resetClock } from '../../support/clock';
import { expectContract } from '../../support/contract';
import { closeDatabase, freshDatabase, query } from '../../support/database';

const SHOW = { method: 'get', path: '/account/contact-phone' };
const UPDATE = { method: 'put', path: '/account/contact-phone' };

/**
 * L2-025.4: an artist keeps a private contact phone in the Contact section of account settings. It is
 * encrypted at rest (L2-079.2), never public, and a booker has no such route (L2-074.1).
 */
describe('the artist contact phone', () => {
  beforeAll(async () => {
    await freshDatabase();
  });

  afterAll(closeDatabase);

  beforeEach(async () => {
    await freshDatabase();
    resetClock();
  });

  it('shows Abigail her contact phone', async () => {
    const browser = await signedIn(ABIGAIL);

    const response = await browser.json('/api/v1/account/contact-phone', 'GET');

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: { contactPhone: '905-555-0148' } });
    expectContract(response, SHOW, { data: { contactPhone: '905-555-0148' } });
  });

  it('saves a new number encrypted, in E.164', async () => {
    const browser = await signedIn(ABIGAIL);

    const response = await browser.json('/api/v1/account/contact-phone', 'PUT', {
      contactPhone: '+1 (416) 555-0190',
    });

    expect(response.status).toBe(200);
    const body = (await response.json()) as { data: { contactPhone: string } };
    expect(body.data.contactPhone).toBe('416-555-0190');
    expectContract(response, UPDATE, body);
    const [row] = await query<{ contact_phone: string }>(
      sql`select contact_phone from artists where slug = 'abigail-mensah'`,
    );
    expect(row?.contact_phone.startsWith('v1:')).toBe(true);
    expect(decryptField(row?.contact_phone ?? '')).toBe('+14165550190');
  });

  it('refuses a number outside North America or a blank one', async () => {
    const browser = await signedIn(ABIGAIL);

    for (const contactPhone of ['+44 20 7946 0958', '905-555-01', '', '123-555-0148']) {
      const response = await browser.json('/api/v1/account/contact-phone', 'PUT', { contactPhone });

      expect(response.status, contactPhone).toBe(422);
      expect(((await response.json()) as { errors: object }).errors).toHaveProperty('contactPhone');
    }
    const shown = (await (await browser.json('/api/v1/account/contact-phone', 'GET')).json()) as {
      data: { contactPhone: string };
    };
    expect(shown.data.contactPhone).toBe('905-555-0148');
  });

  it('gives a booker the same 404 as an unknown address', async () => {
    const browser = await signedIn(NAOMI);

    const update = await browser.json('/api/v1/account/contact-phone', 'PUT', {
      contactPhone: '905-555-0123',
    });
    expect(update.status).toBe(404);
    expect((await browser.json('/api/v1/account/contact-phone', 'GET')).status).toBe(404);
  });

  it('never puts the phone on the public profile', async () => {
    const response = await api('/api/v1/artists/abigail-mensah');

    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).not.toContain('555-0148');
    expect(text).not.toContain('5550148');
  });
});
