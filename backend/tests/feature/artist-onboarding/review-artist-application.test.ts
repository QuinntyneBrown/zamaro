import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { Browser } from '../../support/accounts';
import { PRIYA_EMAIL, PRIYA_TOTP_SECRET, signInWithCode } from '../../support/admin';
import { resetClock } from '../../support/clock';
import { expectContract } from '../../support/contract';
import { closeDatabase, freshDatabase, query } from '../../support/database';

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

const DETAIL = { method: 'get', path: '/admin/artist-applications/{application}' };

interface Detail {
  id: number;
  number: string;
  status: string;
  name: string;
  email: string;
  actType: string;
  baseCity: string;
  styles: string[];
  fromPriceCents: number;
  maxDriveKm: number;
  submittedAt: string;
  bio: string;
  references: {
    id: number;
    name: string;
    church: string;
    contact: string;
    verifiedAt: string | null;
    verifiedBy: { name: string } | null;
  }[];
  videos: { title: string; durationSeconds: number | null }[];
  vsc: unknown;
}

/**
 * L2-067.1, L2-079.2, L2-069.1 (review-artist-application): the review screen shows every
 * applicant detail, the references with their decrypted contacts and the videos; opening it is
 * audited as `application.viewed`.
 */
describe('the application review screen', () => {
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

  async function idOf(number: string): Promise<number> {
    const queue = (await (await priya.json(QUEUE, 'GET')).json()) as QueuePage;
    const row = queue.data.find((candidate) => candidate.number === number);
    if (row === undefined) throw new Error(`${number} is not in the queue.`);
    return row.id;
  }

  it("shows Tobi's details, references and video", async () => {
    const id = await idOf('A-0219');

    const response = await priya.json(`${QUEUE}/${String(id)}`, 'GET');

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toContain('no-store');
    const body = (await response.json()) as { data: Detail };
    expectContract(response, DETAIL, body);
    const tobi = body.data;
    expect(tobi).toMatchObject({
      number: 'A-0219',
      status: 'submitted',
      name: 'Tobi Adeyemi',
      email: 'tobi@tobiadeyemi.ca',
      actType: 'solo',
      baseCity: 'Scarborough, ON',
      styles: ['solo-vocalist', 'acoustic', 'hymns'],
      fromPriceCents: 40000,
      maxDriveKm: 80,
      vsc: null,
    });
    expect(tobi.bio).toHaveLength(336);
    expect(new Date(tobi.submittedAt).toISOString()).toBe('2026-10-09T14:42:00.000Z');
    expect(
      tobi.references.map((reference) => [reference.name, reference.church, reference.contact]),
    ).toEqual([
      [
        'Pastor Samuel Osei',
        'Cornerstone Baptist, Scarborough',
        'samuel.osei@cornerstonebaptist.ca',
      ],
      ['Ruth Kim', 'Agincourt Community Church', '647 555 0192'],
    ]);
    expect(tobi.references.every((reference) => reference.verifiedAt === null)).toBe(true);
    expect(tobi.videos).toEqual([
      expect.objectContaining({ title: 'Way Maker — live at Cornerstone', durationSeconds: 348 }),
    ]);
  });

  it('audits opening it as application.viewed', async () => {
    const id = await idOf('A-0219');

    await priya.json(`${QUEUE}/${String(id)}`, 'GET');

    const entries = await query(
      sql`select target_type, target_id from audit_entries where action = 'application.viewed'`,
    );
    expect(entries).toEqual([{ target_type: 'artist_application', target_id: id }]);
  });

  it('answers 404 for an application that does not exist', async () => {
    const response = await priya.json(`${QUEUE}/999999`, 'GET');

    expect(response.status).toBe(404);
  });
});
