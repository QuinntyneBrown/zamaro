import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { disk } from '@/server/integrations/storage/disks';
import { readDocument } from '@/server/services/artist-onboarding/document-vault';
import { ABIGAIL, Browser, NAOMI, signedIn } from '../../support/accounts';
import { resetClock } from '../../support/clock';
import { expectContract } from '../../support/contract';
import { closeDatabase, freshDatabase, query } from '../../support/database';
import { failedJobs, holdJobs, queuedJob, workNextJob } from '../../support/jobs';
import { captureLogs } from '../../support/logs';

const CHECKS = '/api/v1/artist/vulnerable-sector-checks';
const STORE = { method: 'post', path: '/artist/vulnerable-sector-checks' };
const CURRENT = { method: 'get', path: '/artist/vulnerable-sector-checks/current' };
const PDF = '%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\n%%EOF\n';
// Built at runtime, never committed as a file, so no antivirus quarantines the repository.
const EICAR = ['X5O!P%@AP[4\\PZX54(P^)7CC)7}$', 'EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*'].join(
  '',
);

interface UploadRow extends Record<string, unknown> {
  id: string;
  status: string;
  detected_mime: string;
  size_bytes: number;
  quarantine_key: string | null;
  rejection_reason: string | null;
  scanner_signature: string | null;
}

interface CheckRow extends Record<string, unknown> {
  status: string;
  storage_key: string | null;
  wrapped_data_key: string | null;
  mime_type: string | null;
}

/**
 * L2-049.1, L2-075.4, L2-076.1–.2, L2-079.2, L2-092 (verify-vulnerable-sector-check,
 * scan-and-serve-uploads): an artist uploads a check, which is typed by content, quarantined, scanned
 * and then stored encrypted under a random name and queued for verification; malware is deleted and
 * logged; a scanner error retries and leaves the file in quarantine.
 */
describe('uploading a vulnerable sector check', () => {
  let abigail: Browser;
  let logs: ReturnType<typeof captureLogs>;

  beforeAll(async () => {
    await freshDatabase();
    logs = captureLogs();
  });

  afterAll(() => {
    logs.restore();
    return closeDatabase();
  });

  beforeEach(async () => {
    await freshDatabase();
    resetClock();
    holdJobs();
    abigail = await signedIn(ABIGAIL);
  });

  it('accepts a PDF check, quarantines it and queues the scan', async () => {
    const response = await upload(pdf('check.pdf', 2 * 1024 * 1024), '2026-10-05');

    expect(response.status).toBe(202);
    const body = (await response.json()) as { data: Record<string, unknown> };
    expect(body.data.status).toBe('scanning');
    expect(body.data.issuedOn).toBe('2026-10-05');
    expect(body.data.expiresOn).toBeNull();
    expectContract(response, STORE, body);
    const uploaded = await onlyUpload();
    expect(uploaded.status).toBe('quarantined');
    expect(uploaded.detected_mime).toBe('application/pdf');
    expect(uploaded.size_bytes).toBe(2 * 1024 * 1024);
    expect(await disk('quarantine').exists(uploaded.quarantine_key ?? '')).toBe(true);
    expect(queuedJob('uploads')?.queue).toBe('uploads');
  });

  it('stores a clean file encrypted under a random name and the check waits for verification', async () => {
    expect((await upload(pdf('check.pdf', 64 * 1024), '2026-10-05')).status).toBe(202);

    await workNextJob('uploads');

    const uploaded = await onlyUpload();
    const check = await checkOf(uploaded.id);
    expect(check.status).toBe('pending');
    expect(uploaded.status).toBe('clean');
    expect(check.storage_key).toMatch(/^[0-9a-f]{32}$/);
    expect(check.mime_type).toBe('application/pdf');
    expect(check.wrapped_data_key).not.toBeNull();
    expect(await disk('quarantine').exists(uploaded.quarantine_key ?? '')).toBe(false);
    const stored = await disk('documents').get(check.storage_key ?? '');
    expect(stored?.toString('latin1')).not.toContain('%PDF');
    const plain = await readDocument({
      key: check.storage_key ?? '',
      wrappedDataKey: check.wrapped_data_key ?? '',
    });
    expect(plain.toString('utf8').startsWith('%PDF-1.4')).toBe(true);

    const current = await abigail.json(`${CHECKS}/current`, 'GET');
    expect(current.status).toBe(200);
    const currentBody = (await current.json()) as {
      data: { verified: { status: string } | null; latest: { status: string } | null };
    };
    expect(currentBody.data.verified?.status).toBe('verified');
    expect(currentBody.data.latest?.status).toBe('pending');
    expectContract(current, CURRENT, currentBody);
  });

  it('types a file by its content, not its name', async () => {
    expect((await upload(pdf('scan.png', 4096), '2026-10-05')).status).toBe(202);

    expect((await onlyUpload()).detected_mime).toBe('application/pdf');
  });

  it('refuses SVG and HTML whatever they are called', async () => {
    const svg = file(
      'check.pdf',
      '<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
    );
    const html = file('check.jpg', '  \n<!doctype html><html><body>hi</body></html>');

    for (const markup of [svg, html]) {
      const response = await upload(markup, '2026-10-05');
      expect(response.status).toBe(422);
      const body = (await response.json()) as { errors: Record<string, string[]> };
      expect(body.errors.file?.[0]).toBe(
        'This file isn’t a PDF, JPEG or PNG. Choose a scan of the whole check.',
      );
    }
    expect(await query(sql`select id from uploads`)).toEqual([]);
    expect(
      await query(sql`select id from vulnerable_sector_checks where status = 'scanning'`),
    ).toEqual([]);
  });

  it('refuses a file over 10 MB with its size', async () => {
    const response = await upload(pdf('check.pdf', 14 * 1024 * 1024), '2026-10-05');

    expect(response.status).toBe(422);
    const body = (await response.json()) as { errors: Record<string, string[]> };
    expect(body.errors.file?.[0]).toBe(
      'This file is 14 MB. Choose a PDF, JPEG or PNG up to 10 MB.',
    );
    expectContract(response, STORE, body);
  });

  it('needs an issue date that is not in the future', async () => {
    const missing = await upload(pdf('check.pdf', 4096), null);
    expect(missing.status).toBe(422);
    expect(
      ((await missing.json()) as { errors: Record<string, string[]> }).errors.issuedOn?.[0],
    ).toBe('Enter the issue date printed on the check.');

    const future = await upload(pdf('check.pdf', 4096), '2026-10-10');
    expect(future.status).toBe(422);
    expect(((await future.json()) as { errors: object }).errors).toHaveProperty('issuedOn');
    expect((await upload(pdf('check.pdf', 4096), '2026-10-09')).status).toBe(202);
  });

  it('deletes malware, blocks the check and logs a security event', async () => {
    expect((await upload(file('check.pdf', PDF + EICAR), '2026-10-05')).status).toBe(202);
    const before = await onlyUpload();

    await workNextJob('uploads');

    const uploaded = await onlyUpload();
    expect(uploaded.status).toBe('rejected');
    expect(uploaded.rejection_reason).toBe('malware');
    expect(uploaded.scanner_signature).toBe('EICAR-Test-File');
    expect(await disk('quarantine').exists(before.quarantine_key ?? '')).toBe(false);
    const check = await checkOf(uploaded.id);
    expect(check.status).toBe('blocked');
    expect(check.storage_key).toBeNull();
    const event = logs.lines().find((line) => line.msg === 'upload.rejected_malware');
    expect(event).toBeDefined();
    expect(event?.channel).toBe('security');
    expect(event?.signature).toBe('EICAR-Test-File');
    expect(event?.uploadId).toBe(uploaded.id);
    expect(event?.userId).toBe(await abigailId());

    // Her earlier verified check still counts.
    const current = (await (await abigail.json(`${CHECKS}/current`, 'GET')).json()) as {
      data: { verified: { status: string } | null; latest: { status: string } | null };
    };
    expect(current.data.verified?.status).toBe('verified');
    expect(current.data.latest?.status).toBe('blocked');
  });

  it('retries on a scanner error and leaves the file in quarantine', async () => {
    expect(
      (await upload(file('check.pdf', `${PDF}SCANNER-UNAVAILABLE`), '2026-10-05')).status,
    ).toBe(202);

    await workNextJob('uploads');

    const uploaded = await onlyUpload();
    expect(uploaded.status).toBe('quarantined');
    expect(await disk('quarantine').exists(uploaded.quarantine_key ?? '')).toBe(true);
    const job = queuedJob('uploads');
    expect(job).toBeDefined();
    expect(job?.attempts).toBe(1);
    expect(failedJobs()).toEqual([]);
  });

  it('gives a booker 404 because the endpoint is for artists', async () => {
    const naomi = await signedIn(NAOMI);

    const response = await naomi.request(CHECKS, {
      method: 'POST',
      body: form(pdf('check.pdf', 4096), '2026-10-05'),
    });

    expect(response.status).toBe(404);
    expect((await naomi.json(`${CHECKS}/current`, 'GET')).status).toBe(404);
  });

  function pdf(name: string, bytes: number): File {
    return file(name, PDF.padEnd(bytes, '0'));
  }

  function file(name: string, contents: string): File {
    return new File([contents], name, { type: 'application/octet-stream' });
  }

  function form(upload: File, issuedOn: string | null): FormData {
    const data = new FormData();
    data.set('file', upload);
    if (issuedOn !== null) data.set('issuedOn', issuedOn);
    return data;
  }

  function upload(uploadFile: File, issuedOn: string | null): Promise<Response> {
    return abigail.request(CHECKS, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: form(uploadFile, issuedOn),
    });
  }

  async function onlyUpload(): Promise<UploadRow> {
    const rows = await query<UploadRow>(
      sql`select id, status::text as status, detected_mime, size_bytes::int as size_bytes, quarantine_key, rejection_reason, scanner_signature from uploads`,
    );
    expect(rows).toHaveLength(1);
    return rows[0] as UploadRow;
  }

  async function checkOf(uploadId: string): Promise<CheckRow> {
    const rows = await query<CheckRow>(
      sql`select status::text as status, storage_key, wrapped_data_key, mime_type from vulnerable_sector_checks where upload_id = ${uploadId}`,
    );
    expect(rows).toHaveLength(1);
    return rows[0] as CheckRow;
  }

  async function abigailId(): Promise<number> {
    const [row] = await query<{ id: number }>(sql`select id from users where email = ${ABIGAIL}`);
    return row?.id ?? 0;
  }
});
