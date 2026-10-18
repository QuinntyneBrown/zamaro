import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { Browser } from '../../support/accounts';
import { api } from '../../support/app';
import { PRIYA_EMAIL, PRIYA_TOTP_SECRET, signInWithCode } from '../../support/admin';
import { resetClock } from '../../support/clock';
import { expectContract } from '../../support/contract';
import { emailsTo } from '../../support/mail';
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

const VERIFY = {
  method: 'put',
  path: '/admin/artist-applications/{application}/references/{reference}/verification',
};

/**
 * L2-048.1, L2-069.1 (review-artist-application): ticking a reference saves at once, records who and
 * when, and is audited as `application_reference.verified`; unticking clears it. Only a Submitted
 * application's own references can change.
 */
describe('verifying a reference', () => {
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

  async function tobi(): Promise<Detail> {
    const queue = (await (await priya.json(QUEUE, 'GET')).json()) as QueuePage;
    const row = queue.data.find((candidate) => candidate.number === 'A-0219');
    const shown = await priya.json(`${QUEUE}/${String(row?.id)}`, 'GET');
    return ((await shown.json()) as { data: Detail }).data;
  }

  function verification(application: Detail, reference: number): string {
    return `${QUEUE}/${String(application.id)}/references/${String(reference)}/verification`;
  }

  it('records who verified the reference and when, and audits it', async () => {
    const application = await tobi();
    const first = application.references[0];

    const response = await priya.json(verification(application, first?.id ?? 0), 'PUT', {
      verified: true,
    });

    expect(response.status).toBe(200);
    const body = (await response.json()) as { data: Detail['references'][number] };
    expectContract(response, VERIFY, body);
    expect(body.data.verifiedBy).toEqual({ name: 'Priya Nair' });
    expect(new Date(body.data.verifiedAt ?? 0).toISOString()).toBe('2026-10-09T14:00:00.000Z');
    const reopened = await tobi();
    expect(reopened.references.map((reference) => reference.verifiedAt !== null)).toEqual([
      true,
      false,
    ]);
    const entries = await query(
      sql`select target_type, target_id from audit_entries where action = 'application_reference.verified'`,
    );
    expect(entries).toEqual([{ target_type: 'application_reference', target_id: first?.id }]);
  });

  it('clears the verification when it is unticked', async () => {
    const application = await tobi();
    const first = application.references[0]?.id ?? 0;
    await priya.json(verification(application, first), 'PUT', { verified: true });

    const response = await priya.json(verification(application, first), 'PUT', {
      verified: false,
    });

    expect(response.status).toBe(200);
    const body = (await response.json()) as { data: Detail['references'][number] };
    expect(body.data.verifiedAt).toBeNull();
    expect(body.data.verifiedBy).toBeNull();
  });

  it('refuses a body without verified', async () => {
    const application = await tobi();

    const response = await priya.json(
      verification(application, application.references[0]?.id ?? 0),
      'PUT',
      {},
    );

    expect(response.status).toBe(422);
  });

  it("answers 404 for a reference that is not on this application's list", async () => {
    const application = await tobi();

    const response = await priya.json(verification(application, 999999), 'PUT', {
      verified: true,
    });

    expect(response.status).toBe(404);
  });
});

const APPROVE = { method: 'post', path: '/admin/artist-applications/{application}/approval' };

/**
 * L2-048.1, L2-048.3, L2-063, L2-069.1 (review-artist-application): approval needs both references
 * verified, grants the Artist role, creates an artist who stays hidden until payout setup, moves the
 * video to the artist, emails the next step and is audited.
 */
describe('approving an application', () => {
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

  async function tobi(): Promise<Detail> {
    const queue = (await (await priya.json(QUEUE, 'GET')).json()) as QueuePage;
    const row = queue.data.find((candidate) => candidate.number === 'A-0219');
    const shown = await priya.json(`${QUEUE}/${String(row?.id)}`, 'GET');
    return ((await shown.json()) as { data: Detail }).data;
  }

  async function verifyBoth(application: Detail): Promise<void> {
    for (const reference of application.references) {
      const path = `${QUEUE}/${String(application.id)}/references/${String(reference.id)}/verification`;
      expect((await priya.json(path, 'PUT', { verified: true })).status).toBe(200);
    }
  }

  const approval = (application: Detail): string => `${QUEUE}/${String(application.id)}/approval`;

  it('is refused until both references are verified', async () => {
    const application = await tobi();

    const response = await priya.json(approval(application), 'POST');

    expect(response.status).toBe(422);
    const problem = (await response.json()) as { detail: string };
    expect(problem.detail).toBe('Verify both references before you approve.');
    expect((await tobi()).status).toBe('submitted');
  });

  it('makes Tobi an unpublished artist with the Artist role', async () => {
    const application = await tobi();
    await verifyBoth(application);

    const response = await priya.json(approval(application), 'POST');

    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      data: Detail & { decidedBy: { name: string } | null; decidedAt: string | null };
    };
    expectContract(response, APPROVE, body);
    expect(body.data.status).toBe('approved');
    expect(body.data.decidedBy).toEqual({ name: 'Priya Nair' });
    expect(new Date(body.data.decidedAt ?? 0).toISOString()).toBe('2026-10-09T14:00:00.000Z');
    const artists = await query(
      sql`select a.slug, a.ticket_number, a.status, a.payout_ready, a.published_at, a.display_name
          from artists a join users u on u.id = a.user_id where lower(u.email) = 'tobi@tobiadeyemi.ca'`,
    );
    expect(artists).toEqual([
      {
        slug: 'tobi-adeyemi',
        ticket_number: 'ACT-1031',
        status: 'approved',
        payout_ready: false,
        published_at: null,
        display_name: 'Tobi Adeyemi',
      },
    ]);
    const roles = await query(
      sql`select r.name from roles r join role_user ru on ru.role_id = r.id
          join users u on u.id = ru.user_id where lower(u.email) = 'tobi@tobiadeyemi.ca'`,
    );
    expect(roles).toEqual([{ name: 'artist' }]);
    const videos = await query(
      sql`select artist_id from artist_videos where artist_application_id = ${application.id}`,
    );
    expect(videos).toHaveLength(1);
    expect(videos[0]?.artist_id).not.toBeNull();
  });

  it('keeps the artist out of the public profile until payout setup', async () => {
    const application = await tobi();
    await verifyBoth(application);

    await priya.json(approval(application), 'POST');

    expect((await api('/api/v1/artists/tobi-adeyemi')).status).toBe(404);
  });

  it('emails Tobi the next step with a link to set a password, and audits it', async () => {
    const application = await tobi();
    await verifyBoth(application);

    await priya.json(approval(application), 'POST');

    const [email] = emailsTo('tobi@tobiadeyemi.ca');
    expect(email?.text).toContain('payout');
    expect(email?.text).toContain('/reset-password/');
    const entries = await query(
      sql`select action from audit_entries
          where action in ('application.approved', 'user.role_changed') order by action`,
    );
    expect(entries).toEqual([{ action: 'application.approved' }, { action: 'user.role_changed' }]);
  });

  it('answers 409 to a second approval', async () => {
    const application = await tobi();
    await verifyBoth(application);
    await priya.json(approval(application), 'POST');

    const response = await priya.json(approval(application), 'POST');

    expect(response.status).toBe(409);
  });
});

const REJECT = { method: 'post', path: '/admin/artist-applications/{application}/rejection' };

/**
 * L2-048.2, L2-063, L2-069.1 (review-artist-application): rejection needs a reason from the fixed
 * list, takes an optional note of up to 1,000 characters, emails the applicant both, and is audited.
 * Only a Submitted application can be rejected.
 */
describe('rejecting an application', () => {
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

  async function kezia(): Promise<Detail> {
    const queue = (await (await priya.json(QUEUE, 'GET')).json()) as QueuePage;
    const row = queue.data.find((candidate) => candidate.number === 'A-0218');
    const shown = await priya.json(`${QUEUE}/${String(row?.id)}`, 'GET');
    return ((await shown.json()) as { data: Detail }).data;
  }

  const rejection = (application: Detail): string => `${QUEUE}/${String(application.id)}/rejection`;

  it('rejects with a reason and a note, emails both to the applicant, and audits it', async () => {
    const application = await kezia();

    const response = await priya.json(rejection(application), 'POST', {
      reason: 'other',
      note: 'Please apply again once you have a video from a Sunday service.',
    });

    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      data: Detail & {
        decidedBy: { name: string } | null;
        decidedAt: string | null;
        rejection: { reason: string; note: string | null } | null;
      };
    };
    expectContract(response, REJECT, body);
    expect(body.data.status).toBe('rejected');
    expect(body.data.decidedBy).toEqual({ name: 'Priya Nair' });
    expect(new Date(body.data.decidedAt ?? 0).toISOString()).toBe('2026-10-09T14:00:00.000Z');
    expect(body.data.rejection).toEqual({
      reason: 'other',
      note: 'Please apply again once you have a video from a Sunday service.',
    });
    const [email] = emailsTo(application.email);
    expect(email?.subject).toContain('application');
    expect(email?.text).toContain('Other');
    expect(email?.text).toContain(
      'Please apply again once you have a video from a Sunday service.',
    );
    const entries = await query(
      sql`select target_type, target_id from audit_entries where action = 'application.rejected'`,
    );
    expect(entries).toEqual([{ target_type: 'artist_application', target_id: application.id }]);
    const queue = (await (await priya.json(QUEUE, 'GET')).json()) as QueuePage;
    expect(queue.data.map((row) => row.number)).toEqual(['A-0217', 'A-0219']);
  });

  it('names the reason in the email when there is no note', async () => {
    const application = await kezia();

    const response = await priya.json(rejection(application), 'POST', {
      reason: 'videos-not-leading-worship',
    });

    expect(response.status).toBe(200);
    const [email] = emailsTo(application.email);
    expect(email?.text).toContain("Videos don't show you leading worship");
  });

  it('refuses a missing reason, one outside the list, and a note over 1,000 characters', async () => {
    const application = await kezia();

    const missing = await priya.json(rejection(application), 'POST', {});
    const unknown = await priya.json(rejection(application), 'POST', { reason: 'too-loud' });
    const long = await priya.json(rejection(application), 'POST', {
      reason: 'other',
      note: 'x'.repeat(1001),
    });

    expect([missing.status, unknown.status, long.status]).toEqual([422, 422, 422]);
    const problem = (await long.json()) as { errors: Record<string, string[]> };
    expect(problem.errors.note?.[0]).toContain('1,000');
    expect((await kezia()).status).toBe('submitted');
    expect(emailsTo(application.email)).toHaveLength(0);
  });

  it('answers 409 once the application is decided', async () => {
    const application = await kezia();
    await priya.json(rejection(application), 'POST', { reason: 'other' });

    const response = await priya.json(rejection(application), 'POST', { reason: 'other' });

    expect(response.status).toBe(409);
    expect(emailsTo(application.email)).toHaveLength(1);
  });

  it('answers 404 for an application that does not exist', async () => {
    const response = await priya.json(`${QUEUE}/999999/rejection`, 'POST', { reason: 'other' });

    expect(response.status).toBe(404);
  });
});
