import { randomUUID } from 'node:crypto';
import { eq, sql } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { config } from '@config/zamaro';
import { startVideoUpload } from '@/server/actions/artist-onboarding/application-videos';
import { db } from '@/server/db/client';
import { artistApplications, artistVideos } from '@/server/db/schema';
import { ApplicationStatus, VideoStatus } from '@/server/enums';
import { decryptField } from '@/server/support/encryption/field-cipher';
import { Browser } from '../../support/accounts';
import { resetClock, travelTo } from '../../support/clock';
import { expectContract } from '../../support/contract';
import { closeDatabase, freshDatabase, query } from '../../support/database';
import { emailsTo, sentEmails } from '../../support/mail';

const APPLICATIONS = '/api/v1/artist-applications';
const STORE = { method: 'post', path: '/artist-applications' };
const TOBI = 'tobi@tobiadeyemi.ca';
const BIO =
  'I’m a vocalist and keys player from Scarborough, and I’ve led Sunday worship at Cornerstone Baptist for six years. I lead from the piano, so I can carry a service on my own or slot in with your band. My sets mix the hymns your seniors love with newer songs your youth know, and I’m happy to learn what your congregation sings.';

interface Application {
  data: {
    id: number;
    number: string;
    status: string;
    name: string;
    email: string;
    submittedAt: string;
    replyBy: string;
    skippedHolidays: { date: string; name: string }[];
    videos: { token: string; title: string; status: string }[];
    references: { name: string; church: string }[];
  };
}

interface Reference {
  name: string;
  church: string;
  contact: string;
}

/**
 * L2-047.1, L2-047.4, L2-063, L2-077.4 (apply-as-artist): a guest sends an application with videos
 * and two references and gets its number and a reply-by date 3 business days on, skipping weekends
 * and Ontario's statutory holidays; the confirmation is emailed; the answer never carries a
 * reference's phone or email. M3 S12: refusals and retries (L2-001.3, L2-001.4, L2-047.2, L2-047.3,
 * L2-047.5, L2-075.1, L2-108.3).
 */
describe('submitting an artist application', () => {
  let guest: Browser;

  beforeAll(async () => {
    await freshDatabase({ seed: false });
  });

  afterAll(closeDatabase);

  beforeEach(async () => {
    await freshDatabase({ seed: false });
    resetClock();
    guest = new Browser();
    await guest.request('/api/v1/csrf-cookie');
  });

  it('gives a guest its number, reply-by date and confirmation', async () => {
    const video = await liveVideo('Way Maker, live at Cornerstone');
    const key = randomUUID();

    const response = await submit(await tobi({ videos: [video] }), key);

    expect(response.status).toBe(201);
    const text = await response.clone().text();
    const body = (await response.json()) as Application;
    expectContract(response, STORE, body);
    expect(body.data).toMatchObject({
      number: 'A-0217',
      status: 'submitted',
      name: 'Tobi Adeyemi',
      email: TOBI,
      replyBy: '2026-10-15',
      skippedHolidays: [{ date: '2026-10-12', name: 'Thanksgiving' }],
    });
    expect(new Date(body.data.submittedAt).toISOString()).toBe('2026-10-09T14:00:00.000Z');
    expect(body.data.videos[0]?.title).toBe('Way Maker, live at Cornerstone');
    expect(body.data.references[0]).toEqual({
      name: 'Pastor Samuel Osei',
      church: 'Cornerstone Baptist, Scarborough',
    });
    expect(body.data.references[1]?.name).toBe('Ruth Kim');
    // Reference contacts stay private (L2-079): neither the email nor the phone is in the answer.
    expect(text).not.toContain('samuel.osei@cornerstonebaptist.ca');
    expect(text).not.toContain('647');

    const [application] = await db()
      .select()
      .from(artistApplications)
      .where(eq(artistApplications.email, TOBI));
    expect(application?.status).toBe(ApplicationStatus.Submitted);
    expect(application?.idempotencyKey).toBe(key);
    expect(application?.baseCity).toBe('Scarborough');
    expect(application?.baseLatitude).toBeCloseTo(43.77, 1);
    expect(application?.styles).toEqual(['solo-vocalist', 'acoustic', 'hymns']);
    expect(application?.fromPriceCents).toBe(40000);
    expect(application?.maxDriveKm).toBe(80);
    expect(application?.userId).toBeNull();

    const references = await query<{ id: number; email: string | null; phone: string | null }>(
      sql`select id, email, phone from application_references where artist_application_id = ${application?.id ?? 0} order by id`,
    );
    expect(references).toHaveLength(2);
    expect(decryptField(references[0]?.email ?? '')).toBe('samuel.osei@cornerstonebaptist.ca');
    expect(references[0]?.phone).toBeNull();
    expect(decryptField(references[1]?.phone ?? '')).toBe('+16475550192');
    expect(references[1]?.email).toBeNull();
    // Encrypted at rest (L2-079.2): the raw column is not the address.
    expect(references[0]?.email).not.toBe('samuel.osei@cornerstonebaptist.ca');

    const [attached] = await db()
      .select({ applicationId: artistVideos.artistApplicationId, position: artistVideos.position })
      .from(artistVideos)
      .where(eq(artistVideos.uploadToken, video));
    expect(attached?.applicationId).toBe(application?.id);
    expect(attached?.position).toBe(1);

    const [email] = emailsTo(TOBI);
    expect(email?.subject).toBe('We received your application, A-0217');
    expect(email?.html).toContain('Hi Tobi,');
    expect(email?.html).toContain('Thu 15 Oct');
  });

  it('sets the reply-by date three business days on, skipping weekends and Ontario holidays', async () => {
    // Wed 7 Oct: Thu, Fri, then Tue 13 (Mon 12 Oct is Thanksgiving).
    travelTo('2026-10-07 16:00');
    expect(await replyBy(await tobi({ email: 'wed@example.ca' }))).toEqual({
      replyBy: '2026-10-13',
    });

    // Thu 24 Dec: Christmas and Boxing Day (observed Mon 28 Dec) are skipped: Tue 29, Wed 30, Thu 31.
    travelTo('2026-12-24 09:00');
    expect(await replyBy(await tobi({ email: 'dec@example.ca' }))).toEqual({
      replyBy: '2026-12-31',
      holidays: ['Christmas Day', 'Boxing Day'],
    });

    // Sat 10 Oct: the count starts on the next business day: Tue 13, Wed 14, Thu 15.
    travelTo('2026-10-10 11:00');
    expect(await replyBy(await tobi({ email: 'sat@example.ca' }))).toEqual({
      replyBy: '2026-10-15',
    });
  });

  it('counts the numbers up from the cast', async () => {
    const one = (await (
      await submit(await tobi({ email: 'one@example.ca' }), randomUUID())
    ).json()) as Application;
    expect(one.data.number).toBe('A-0217');
    const two = (await (
      await submit(await tobi({ email: 'two@example.ca' }), randomUUID())
    ).json()) as Application;
    expect(two.data.number).toBe('A-0218');
  });

  it('runs the bot check first and needs an idempotency key', async () => {
    const failed = await submit(await tobi({ challengeToken: 'fail' }), randomUUID());
    expect(failed.status).toBe(422);
    expect(((await failed.json()) as { errors: object }).errors).toHaveProperty('challengeToken');
    expect(await query(sql`select id from artist_applications`)).toEqual([]);

    const keyless = await guest.json(APPLICATIONS, 'POST', await tobi());
    expect(keyless.status).toBe(422);
    expect(((await keyless.json()) as { errors: object }).errors).toHaveProperty('idempotencyKey');
  });

  it('names a reference without a contact and a reference that is the applicant together', async () => {
    const application = await tobi();
    (application.references as Reference[])[0]!.contact = '';
    (application.references as Reference[])[1]!.contact = 'Tobi@TobiAdeyemi.ca';

    const response = await submit(application, randomUUID());

    expect(response.status).toBe(422);
    const { errors } = (await response.json()) as { errors: Record<string, string[]> };
    expect(errors['references.0.contact']).toEqual([
      'Add a phone number or email so we can reach them.',
    ]);
    expect(errors['references.1.contact']).toEqual(['References must be someone other than you.']);
    expect(await query(sql`select id from artist_applications`)).toEqual([]);
  });

  it('refuses a base city outside the service area and stores nothing', async () => {
    const application = await tobi({ baseCity: 'Ottawa' });
    const [token] = application.videos as string[];

    const response = await submit(application, randomUUID());

    expect(response.status).toBe(422);
    expect(
      ((await response.json()) as { errors: Record<string, string[]> }).errors.baseCity?.[0],
    ).toBe('Zamaro serves churches within 200 km of Toronto.');
    expect(await query(sql`select id from artist_applications`)).toEqual([]);
    expect(await query(sql`select id from application_references`)).toEqual([]);
    // The video stays the applicant's to send again.
    const [video] = await db()
      .select({ applicationId: artistVideos.artistApplicationId })
      .from(artistVideos)
      .where(eq(artistVideos.uploadToken, token ?? ''));
    expect(video?.applicationId).toBeNull();
    expect(sentEmails()).toEqual([]);
  });

  it('refuses a base city that cannot be found', async () => {
    const response = await submit(await tobi({ baseCity: 'Atlantis' }), randomUUID());

    expect(response.status).toBe(422);
    expect(
      ((await response.json()) as { errors: Record<string, string[]> }).errors.baseCity?.[0],
    ).toBe('We couldn’t find that address. Check the street and postal code.');
    expect(await query(sql`select id from artist_applications`)).toEqual([]);
  });

  it('refuses a second pending application from the same email, ignoring case', async () => {
    expect((await submit(await tobi(), randomUUID())).status).toBe(201);

    const response = await submit(
      await tobi({ email: 'TOBI@TobiAdeyemi.ca', name: 'T. Adeyemi' }),
      randomUUID(),
    );

    expect(response.status).toBe(409);
    expect(response.headers.get('content-type')).toBe('application/problem+json');
    const body = (await response.json()) as Record<string, string>;
    expect(body.type).toBe(`${config().problemsBaseUri}/application-in-review`);
    expect(body.title).toBe('You already have an application in review');
    expect(body.detail).toBe(
      'We’re reviewing the one you sent from tobi@tobiadeyemi.ca and will reply there. Your answers here are kept.',
    );
    expect(body.email).toBe(TOBI);
    expectContract(response, STORE, body);
    expect(await query(sql`select id from artist_applications`)).toHaveLength(1);

    // A decided application does not block a new one.
    await db().update(artistApplications).set({ status: ApplicationStatus.Rejected });
    const next = await submit(await tobi(), randomUUID());
    expect(next.status).toBe(201);
    expect(((await next.json()) as Application).data.number).toBe('A-0218');
  });

  it('answers a retry with the same idempotency key with the application it created', async () => {
    const key = randomUUID();
    const application = await tobi();
    const first = await submit(application, key);
    expect(first.status).toBe(201);
    const firstBody = (await first.json()) as Application;

    // The same payload again, videos included (they now belong to the application): the retry runs
    // before the duplicate-email check, so it is 200, not 409 or 422, and sends no second email.
    const retry = await submit(application, key);

    expect(retry.status).toBe(200);
    const body = (await retry.json()) as Application;
    expect(body.data.number).toBe(firstBody.data.number);
    expect(body.data.replyBy).toBe('2026-10-15');
    expectContract(retry, STORE, body);
    expect(await query(sql`select id from artist_applications`)).toHaveLength(1);
    expect(emailsTo(TOBI)).toHaveLength(1);
  });

  it('keeps one application per email when two sends land together', async () => {
    // Another send from the same email, in any case, already holds the one pending row the partial
    // unique index allows (L2-047.3): the database refuses a second, and the applicant reads 409.
    await db()
      .insert(artistApplications)
      .values({
        number: 'A-0300',
        name: 'Tobi Adeyemi',
        email: 'Tobi@tobiadeyemi.ca',
        actType: 'solo',
        baseCity: 'Scarborough',
        baseLatitude: 43.77,
        baseLongitude: -79.25,
        styles: ['hymns'],
        bio: 'x'.repeat(100),
        fromPriceCents: 40000,
        maxDriveKm: 80,
        status: ApplicationStatus.Submitted,
        idempotencyKey: randomUUID(),
        submittedAt: new Date(),
      });
    await expect(
      db()
        .insert(artistApplications)
        .values({
          number: 'A-0301',
          name: 'Tobi Adeyemi',
          email: TOBI,
          actType: 'solo',
          baseCity: 'Scarborough',
          baseLatitude: 43.77,
          baseLongitude: -79.25,
          styles: ['hymns'],
          bio: 'x'.repeat(100),
          fromPriceCents: 40000,
          maxDriveKm: 80,
          status: ApplicationStatus.Submitted,
          idempotencyKey: randomUUID(),
          submittedAt: new Date(),
        }),
    ).rejects.toThrow();
    const key = randomUUID();

    const response = await submit(await tobi(), key);

    expect(response.status).toBe(409);
    expect(((await response.json()) as { type: string }).type).toBe(
      `${config().problemsBaseUri}/application-in-review`,
    );
    expect(
      await query(sql`select id from artist_applications where idempotency_key = ${key}`),
    ).toEqual([]);
    expect(await query(sql`select id from application_references`)).toEqual([]);
    expect(sentEmails()).toEqual([]);
  });

  /** A video the applicant uploaded and the transcoder finished (M3 S10); answers its token. */
  async function liveVideo(title: string): Promise<string> {
    const video = await startVideoUpload(title, 'way-maker.mp4', 30_000);
    await db()
      .update(artistVideos)
      .set({ status: VideoStatus.Live, uploadedBytes: 30_000, durationSeconds: 348 })
      .where(eq(artistVideos.id, video.id));
    return video.uploadToken ?? '';
  }

  /** Tobi Adeyemi's application as the mocks show it (docs/mocks/pages/apply). */
  async function tobi(overrides: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
    return {
      name: 'Tobi Adeyemi',
      email: TOBI,
      baseCity: 'Scarborough',
      actType: 'solo',
      styles: ['solo-vocalist', 'acoustic', 'hymns'],
      bio: BIO,
      fromPrice: 400,
      maxDriveKm: 80,
      videos: [await liveVideo('Way Maker, live at Cornerstone')],
      references: [
        {
          name: 'Pastor Samuel Osei',
          church: 'Cornerstone Baptist, Scarborough',
          contact: 'samuel.osei@cornerstonebaptist.ca',
        },
        { name: 'Ruth Kim', church: 'Agincourt Community Church', contact: '647 555 0192' },
      ],
      challengeToken: 'pass',
      ...overrides,
    };
  }

  function submit(application: Record<string, unknown>, idempotencyKey: string): Promise<Response> {
    return guest.request(APPLICATIONS, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(application),
    });
  }

  async function replyBy(
    application: Record<string, unknown>,
  ): Promise<{ replyBy: string; holidays?: string[] }> {
    const response = await submit(application, randomUUID());
    expect(response.status).toBe(201);
    const body = (await response.json()) as Application;
    const holidays = body.data.skippedHolidays.map((holiday) => holiday.name);
    return holidays.length === 0
      ? { replyBy: body.data.replyBy }
      : { replyBy: body.data.replyBy, holidays };
  }
});
