import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { config } from '@config/zamaro';
import { db } from '@/server/db/client';
import { legalDocuments, vulnerableSectorChecks } from '@/server/db/schema';
import { AuditAction, ConsentKind, VscStatus } from '@/server/enums';
import { storeDocument } from '@/server/services/artist-onboarding/document-vault';
import { now } from '@/server/support/clock';
import { ABIGAIL, Browser, freshBooker, signedIn } from '../../support/accounts';
import {
  makeAdministratorWithTwoStep,
  PRIYA_EMAIL,
  PRIYA_TOTP_SECRET,
  signInWithCode,
} from '../../support/admin';
import { api } from '../../support/app';
import { resetClock, travel, travelTo } from '../../support/clock';
import { expectContract } from '../../support/contract';
import { closeDatabase, freshDatabase, query } from '../../support/database';

const LINK = { method: 'get', path: '/vulnerable-sector-checks/{check}/document-link' };
const ADMIN_LINK = { method: 'get', path: '/admin/vulnerable-sector-checks/{check}/document-link' };
const PDF = '%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\n%%EOF\n';

interface Link {
  data: { url: string; expiresAt: string };
}

/**
 * L2-049.4, L2-076.3, L2-089 (verify-vulnerable-sector-check, scan-and-serve-uploads): the owner
 * and an administrator get a 5-minute signed link on the media host, which streams the document with
 * server-set headers; an altered or expired link, or the same path on the API host, is 404.
 */
describe('the signed link to a check document', () => {
  let checkId: number;
  let storageKey: string;

  beforeAll(async () => {
    await freshDatabase();
  });

  afterAll(closeDatabase);

  beforeEach(async () => {
    await freshDatabase();
    resetClock();
    const stored = await storeDocument(Buffer.from(PDF));
    storageKey = stored.key;
    const [abigail] = await query<{ id: number }>(
      sql`select id from users where email = ${ABIGAIL}`,
    );
    const [check] = await db()
      .insert(vulnerableSectorChecks)
      .values({
        userId: abigail?.id ?? 0,
        issuedOn: '2026-10-05',
        status: VscStatus.Pending,
        storageKey: stored.key,
        wrappedDataKey: stored.wrappedDataKey,
        mimeType: 'application/pdf',
        sizeBytes: PDF.length,
      })
      .returning({ id: vulnerableSectorChecks.id });
    checkId = check?.id ?? 0;
  });

  it('gives the owner a five-minute link on the media host', async () => {
    const abigail = await signedIn(ABIGAIL);

    const response = await abigail.json(linkPath(), 'GET');

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    const body = (await response.json()) as Link;
    expectContract(response, LINK, body);
    const url = new URL(body.data.url);
    expect(url.host).toBe(config().mediaHost);
    expect(url.pathname).toBe(`/documents/${storageKey}`);
    expect(new Date(body.data.expiresAt).toISOString()).toBe(
      now().plus({ minutes: 5 }).toUTC().toISO(),
    );
    expect(
      await query(
        sql`select id from audit_entries where action = ${AuditAction.VscDocumentViewed}`,
      ),
    ).toEqual([]);
  });

  it("records an administrator's link in the audit log", async () => {
    const priya = await signInWithCode(PRIYA_EMAIL, PRIYA_TOTP_SECRET);

    const response = await priya.json(linkPath(), 'GET');

    expect(response.status).toBe(200);
    const entries = await query<{ actor_id: number; target_id: number }>(
      sql`select actor_id, target_id from audit_entries where action = ${AuditAction.VscDocumentViewed}`,
    );
    expect(entries).toHaveLength(1);
    const [priyaRow] = await query<{ id: number }>(
      sql`select id from users where email = ${PRIYA_EMAIL}`,
    );
    expect(entries[0]?.actor_id).toBe(priyaRow?.id);
    expect(entries[0]?.target_id).toBe(checkId);
    expect(new URL(((await response.json()) as Link).data.url).host).toBe(config().mediaHost);
  });

  it('lets an administrator who has not accepted the current terms take the link from the admin API', async () => {
    // An administrator who accepted the October terms; then November's take effect without them.
    const email = await freshBooker();
    const secret = await makeAdministratorWithTwoStep(email);
    await db()
      .insert(legalDocuments)
      .values({
        kind: ConsentKind.Terms,
        version: '2026-11',
        effectiveFrom: '2026-11-01',
        url: 'https://zamaro.ca/legal/terms',
        summaryOfChanges: ['A newer clause.'],
      });
    travelTo('2026-11-02 10:00');
    const admin = await signInWithCode(email, secret);

    const stopped = await admin.json(linkPath(), 'GET');
    expect(stopped.status).toBe(409);
    expect(((await stopped.json()) as { type: string }).type).toBe(
      `${config().problemsBaseUri}/terms-acceptance-required`,
    );

    const response = await admin.json(
      `/api/v1/admin/vulnerable-sector-checks/${String(checkId)}/document-link`,
      'GET',
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    const body = (await response.json()) as Link;
    expectContract(response, ADMIN_LINK, body);
    expect(new URL(body.data.url).host).toBe(config().mediaHost);
    const entries = await query<{ target_id: number }>(
      sql`select target_id from audit_entries where action = ${AuditAction.VscDocumentViewed}`,
    );
    expect(entries.map((entry) => entry.target_id)).toEqual([checkId]);
    expect((await api(body.data.url)).status).toBe(200);
  });

  it('streams the document with server-set headers', async () => {
    const url = await ownersLink();

    const document = await api(url);

    expect(document.status).toBe(200);
    expect(document.headers.get('content-type')).toBe('application/pdf');
    expect(document.headers.get('content-disposition')).toBe(
      'attachment; filename="vulnerable-sector-check.pdf"',
    );
    expect(document.headers.get('cache-control')).toBe('private, no-store');
    expect(document.headers.get('x-content-type-options')).toBe('nosniff');
    expect(document.headers.get('content-security-policy')).toBe("default-src 'none'; sandbox");
    expect(await document.text()).toBe(PDF);
  });

  it('answers not found to an altered or expired link, and on the API host', async () => {
    const url = await ownersLink();
    const unknown = (await (await api('/api/v1/nothing-here')).json()) as { title: string };

    const altered = await api(url.replace(/signature=([0-9a-f])/, 'signature=0'));
    expect(altered.status).toBe(404);
    expect(((await altered.json()) as { title: string }).title).toBe(unknown.title);

    const onApiHost = await api(
      url.replace(`http://${config().mediaHost}`, 'http://localhost:8000'),
    );
    expect(onApiHost.status).toBe(404);

    travel({ minutes: 5 });
    expect((await api(url)).status).toBe(200);
    travel({ seconds: 2 });
    expect((await api(url)).status).toBe(404);
  });

  function linkPath(): string {
    return `/api/v1/vulnerable-sector-checks/${String(checkId)}/document-link`;
  }

  async function ownersLink(): Promise<string> {
    const abigail = await signedIn(ABIGAIL);
    const response = await abigail.json(linkPath(), 'GET');
    expect(response.status).toBe(200);
    return ((await response.json()) as Link).data.url;
  }
});

export { Browser };
