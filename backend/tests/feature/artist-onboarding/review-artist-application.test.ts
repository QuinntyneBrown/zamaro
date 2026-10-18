import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { Browser } from '../../support/accounts';
import { PRIYA_EMAIL, PRIYA_TOTP_SECRET, signInWithCode } from '../../support/admin';
import { resetClock } from '../../support/clock';
import { expectContract } from '../../support/contract';
import { closeDatabase, freshDatabase } from '../../support/database';

const QUEUE = '/api/v1/admin/artist-applications';
const INDEX = { method: 'get', path: '/admin/artist-applications' };

interface QueueRow {
  id: number;
  number: string;
  name: string;
  actType: string;
  baseCity: string;
  submittedAt: string;
}

interface QueuePage {
  data: QueueRow[];
  meta: { waiting: number };
}

/**
 * L2-048.1, L2-066, L2-067.1 (review-artist-application): the administrator's queue lists the
 * Submitted applications, oldest first, as pages/admin-applications draws them.
 */
describe('the application queue', () => {
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

  it('lists the submitted applications, oldest first', async () => {
    const response = await priya.json(QUEUE, 'GET');

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toContain('no-store');
    const body = (await response.json()) as QueuePage;
    expectContract(response, INDEX, body);
    expect(body.meta.waiting).toBe(3);
    expect(body.data.map((row) => [row.number, row.name, row.actType, row.baseCity])).toEqual([
      ['A-0217', 'Ebenezer Brass Band', 'band', 'Oshawa, ON'],
      ['A-0218', 'Kezia & Mark Thompson', 'duo', 'Pickering, ON'],
      ['A-0219', 'Tobi Adeyemi', 'solo', 'Scarborough, ON'],
    ]);
    expect(body.data.map((row) => new Date(row.submittedAt).toISOString())).toEqual([
      '2026-10-06T20:20:00.000Z',
      '2026-10-09T01:05:00.000Z',
      '2026-10-09T14:42:00.000Z',
    ]);
  });
});
