import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { config } from '@config/zamaro';
import { pruneUnattachedUploads } from '@/cli/uploads-prune-unattached';
import { disk } from '@/server/integrations/storage/disks';
import { Browser } from '../../support/accounts';
import { resetClock, travel } from '../../support/clock';
import { expectContract } from '../../support/contract';
import { closeDatabase, freshDatabase, query } from '../../support/database';
import { holdJobs, workNextJob } from '../../support/jobs';
import { captureLogs } from '../../support/logs';

const VIDEOS = '/api/v1/artist-applications/videos';
const START = { method: 'post', path: '/artist-applications/videos' };
const SHOW = { method: 'get', path: '/artist-applications/videos/{token}' };
const CHUNK_TYPE = 'application/offset+octet-stream';
const EICAR = ['X5O!P%@AP[4\\PZX54(P^)7CC)7}$', 'EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*'].join(
  '',
);
/** The bytes an MP4 and a WebM start with. */
const MP4_HEAD = Buffer.concat([
  Buffer.from([0, 0, 0, 0x18]),
  Buffer.from('ftypmp42'),
  Buffer.from([0, 0, 0, 0]),
  Buffer.from('mp42isom'),
]);
const WEBM_HEAD = Buffer.from([
  0x1a, 0x45, 0xdf, 0xa3, 0x9f, 0x42, 0x86, 0x81, 0x01, 0x42, 0xf7, 0x81, 0x01, 0x42, 0xf2, 0x81,
  0x04, 0x42, 0xf3, 0x81, 0x08, 0x42, 0x82, 0x84, 0x77, 0x65, 0x62, 0x6d, 0x42, 0x87, 0x81, 0x02,
  0x42, 0x85, 0x81, 0x02,
]);

interface VideoBody {
  data: {
    token: string;
    status: string;
    title: string;
    fileName: string;
    size: number;
    offset: number;
    durationSeconds: number | null;
    posterUrl: string | null;
    failureReason: string | null;
  };
}

interface VideoRow extends Record<string, unknown> {
  status: string;
  artist_id: number | null;
  upload_id: string | null;
  duration_seconds: number | null;
  manifest_key: string | null;
  poster_key: string | null;
}

interface UploadRow extends Record<string, unknown> {
  detected_mime: string;
  status: string;
  user_id: number | null;
  quarantine_key: string | null;
  object_key: string | null;
}

/**
 * L2-047.1 (videos), L2-052.1, L2-052.2, L2-052.5, L2-076.1, L2-092 (apply-as-artist, ADR-0026): a
 * guest starts a video upload for their application, appends it in chunks, resumes after a dropped
 * connection, and watches it go Processing then Live; the file's type comes from its bytes, malware
 * is deleted, a file over 15 minutes fails with its reason, and a video never attached to an
 * application is deleted after 24 hours.
 */
describe('application video uploads', () => {
  let guest: Browser;
  let logs: ReturnType<typeof captureLogs>;

  beforeAll(async () => {
    await freshDatabase({ seed: false });
    logs = captureLogs();
  });

  afterAll(() => {
    logs.restore();
    return closeDatabase();
  });

  beforeEach(async () => {
    await freshDatabase({ seed: false });
    resetClock();
    holdJobs();
    guest = new Browser();
    await guest.request('/api/v1/csrf-cookie');
  });

  it('lets a guest start an upload, append it in chunks and watch it go live', async () => {
    const file = video(30_000);

    const started = await start('Way Maker — live at Cornerstone', 'way-maker.mp4', file.length);

    expect(started.status).toBe(201);
    const startedBody = (await started.json()) as VideoBody;
    expect(startedBody.data).toMatchObject({
      status: 'uploading',
      title: 'Way Maker — live at Cornerstone',
      fileName: 'way-maker.mp4',
      size: 30_000,
      offset: 0,
    });
    expectContract(started, START, startedBody);
    const token = startedBody.data.token;
    expect(token).toMatch(/^[0-9a-f]{64}$/);
    expect(started.headers.get('location')).toBe(`${config().appUrl}${VIDEOS}/${token}`);

    const first = await append(token, 0, file.subarray(0, 10_000));
    expect(first.status).toBe(204);
    expect(first.headers.get('upload-offset')).toBe('10000');
    const second = await append(token, 10_000, file.subarray(10_000, 20_000));
    expect(second.status).toBe(204);
    expect(second.headers.get('upload-offset')).toBe('20000');
    const midway = (await (await show(token)).json()) as VideoBody;
    expect(midway.data.status).toBe('uploading');
    expect(midway.data.offset).toBe(20_000);

    const last = await append(token, 20_000, file.subarray(20_000));
    expect(last.status).toBe(204);
    expect(last.headers.get('upload-offset')).toBe('30000');

    // Complete: the bytes are in quarantine under a random name, typed by content, and the scan is queued.
    const complete = (await (await show(token)).json()) as VideoBody;
    expect(complete.data.status).toBe('processing');
    expect(complete.data.offset).toBe(30_000);
    const row = await videoRow(token);
    expect(row.status).toBe('processing');
    expect(row.artist_id).toBeNull();
    const upload = await uploadRow(row.upload_id ?? '');
    expect(upload.detected_mime).toBe('video/mp4');
    expect(upload.status).toBe('quarantined');
    expect(upload.user_id).toBeNull();
    const quarantined = await disk('quarantine').get(upload.quarantine_key ?? '');
    expect(quarantined?.equals(file)).toBe(true);

    // The scan passes and the file moves to the originals disk; then it is probed and transcoded.
    await workNextJob('uploads');
    expect((await uploadRow(row.upload_id ?? '')).status).toBe('clean');
    expect(await disk('quarantine').exists(upload.quarantine_key ?? '')).toBe(false);
    await workNextJob('uploads');

    const response = await show(token);
    expect(response.status).toBe(200);
    const live = (await response.json()) as VideoBody;
    expect(live.data.status).toBe('live');
    expect(live.data.durationSeconds).toBe(348);
    expect(live.data.failureReason).toBeNull();
    expectContract(response, SHOW, live);
    const liveRow = await videoRow(token);
    expect(liveRow.status).toBe('live');
    expect(liveRow.duration_seconds).toBe(348);
    expect(await disk('media').exists(liveRow.manifest_key ?? '')).toBe(true);
    expect(await disk('media').exists(liveRow.poster_key ?? '')).toBe(true);
    expect(live.data.posterUrl).toContain(liveRow.poster_key);
  });

  it('resumes from the last completed chunk after a dropped connection', async () => {
    const file = video(24_000);
    const token = await startedToken('Way Maker — live at Cornerstone', 'way-maker.mp4', 24_000);
    expect((await append(token, 0, file.subarray(0, 8_000))).status).toBe(204);
    expect((await append(token, 8_000, file.subarray(8_000, 16_000))).status).toBe(204);

    // The browser asks where the server got to, and continues from there.
    const offset = await offsetOf(token);
    expect(offset.status).toBe(200);
    expect(offset.headers.get('upload-offset')).toBe('16000');
    expect(offset.headers.get('upload-length')).toBe('24000');

    // A chunk from the wrong place is refused and changes nothing.
    const wrong = await append(token, 8_000, file.subarray(8_000, 16_000));
    expect(wrong.status).toBe(409);
    expect(((await wrong.json()) as { type: string }).type).toBe(
      `${config().problemsBaseUri}/upload-offset-mismatch`,
    );
    expect(wrong.headers.get('upload-offset')).toBe('16000');
    expect((await offsetOf(token)).headers.get('upload-offset')).toBe('16000');

    const last = await append(token, 16_000, file.subarray(16_000));
    expect(last.status).toBe(204);
    expect(last.headers.get('upload-offset')).toBe('24000');
    expect(((await (await show(token)).json()) as VideoBody).data.status).toBe('processing');
  });

  it('refuses a short title, an oversized file and an unknown token', async () => {
    const short = await start('Hymn', 'hymn.mp4', 1_000);
    expect(short.status).toBe(422);
    expect(((await short.json()) as { errors: Record<string, string[]> }).errors.title?.[0]).toBe(
      'Give the video a title of 5 to 100 characters.',
    );
    const huge = await start(
      'Great Is Thy Faithfulness, acoustic',
      'hymn.mp4',
      1024 * 1024 * 1024 + 1,
    );
    expect(huge.status).toBe(422);
    expect(((await huge.json()) as { errors: Record<string, string[]> }).errors.size?.[0]).toBe(
      'Choose a video up to 1 GB.',
    );

    const missing = '0'.repeat(64);
    expect((await offsetOf(missing)).status).toBe(404);
    expect((await show(missing)).status).toBe(404);
    expect((await append(missing, 0, Buffer.from('bytes'))).status).toBe(404);
  });

  it('refuses a chunk over 8 MB or of another type', async () => {
    const token = await startedToken(
      'Way Maker — live at Cornerstone',
      'way-maker.mp4',
      9 * 1024 * 1024,
    );

    expect((await append(token, 0, Buffer.alloc(8 * 1024 * 1024 + 1, 0x61))).status).toBe(413);
    const json = await guest.request(`${VIDEOS}/${token}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Upload-Offset': '0',
        Accept: 'application/json',
      },
      body: '{"bytes":"no"}',
    });
    expect(json.status).toBe(415);
    expect((await offsetOf(token)).headers.get('upload-offset')).toBe('0');
  });

  it('types the file by its bytes: a WebM named mp4 is a WebM, and HTML is refused', async () => {
    const webm = Buffer.concat([WEBM_HEAD, Buffer.alloc(2_000)]);
    const webmToken = await startedToken('Oceans, at the youth night', 'oceans.mp4', webm.length);
    expect((await append(webmToken, 0, webm)).status).toBe(204);

    const webmRow = await videoRow(webmToken);
    expect((await uploadRow(webmRow.upload_id ?? '')).detected_mime).toBe('video/webm');

    const html = Buffer.from(
      '<!DOCTYPE html><html><body>not a video</body></html>'.padEnd(2_053, ' '),
    );
    const htmlToken = await startedToken('A page, not a video', 'page.mp4', html.length);
    expect((await append(htmlToken, 0, html)).status).toBe(204);

    const failed = (await (await show(htmlToken)).json()) as VideoBody;
    expect(failed.data.status).toBe('failed');
    expect(failed.data.failureReason).toBe('This file isn’t an MP4, MOV or WebM video.');
    expect((await videoRow(htmlToken)).upload_id).toBeNull();
    // Its parts are gone; the WebM from before is still waiting for its scan.
    expect(await disk('quarantine').list(`video-parts/${htmlToken}`)).toEqual([]);
    const webmUpload = await uploadRow(webmRow.upload_id ?? '');
    expect(await disk('quarantine').exists(webmUpload.quarantine_key ?? '')).toBe(true);
  });

  it('fails a video over 15 minutes with its reason', async () => {
    const file = video(4_000, 'ZAMARO-DURATION=960');
    const token = await startedToken('The whole evening service', 'evening.mp4', file.length);
    expect((await append(token, 0, file)).status).toBe(204);

    await workNextJob('uploads');
    await workNextJob('uploads');

    const body = (await (await show(token)).json()) as VideoBody;
    expect(body.data.status).toBe('failed');
    expect(body.data.failureReason).toBe(
      'This video is 16 minutes long. Videos can be up to 15 minutes.',
    );
    const upload = await uploadRow((await videoRow(token)).upload_id ?? '');
    expect(await disk('originals').exists(upload.object_key ?? '')).toBe(false);
  });

  it('deletes malware, logs it and fails the video', async () => {
    const file = video(4_000, EICAR);
    const token = await startedToken(
      'Way Maker — live at Cornerstone',
      'way-maker.mp4',
      file.length,
    );
    expect((await append(token, 0, file)).status).toBe(204);
    const upload = await uploadRow((await videoRow(token)).upload_id ?? '');

    await workNextJob('uploads');

    const body = (await (await show(token)).json()) as VideoBody;
    expect(body.data.status).toBe('failed');
    expect(body.data.failureReason).toBe(
      'This file failed our malware scan and was deleted. Choose another video.',
    );
    expect(await disk('quarantine').exists(upload.quarantine_key ?? '')).toBe(false);
    expect((await uploadRow(upload.id as string)).object_key).toBeNull();
    expect(logs.lines().some((line) => line.msg === 'upload.rejected_malware')).toBe(true);
  });

  it('deletes a video never attached to an application after 24 hours', async () => {
    const file = video(4_000);
    const old = await startedToken('Way Maker — live at Cornerstone', 'way-maker.mp4', file.length);
    expect((await append(old, 0, file)).status).toBe(204);
    await workNextJob('uploads');
    await workNextJob('uploads');
    const oldRow = await videoRow(old);
    const oldUpload = await uploadRow(oldRow.upload_id ?? '');

    travel({ minutes: 23 * 60 });
    const recent = await startedToken('Oceans, at the youth night', 'oceans.mp4', 6_000);
    expect((await append(recent, 0, video(3_000))).status).toBe(204);

    travel({ minutes: 2 * 60 });
    expect(await pruneUnattachedUploads()).toBe(1);

    expect(await query(sql`select id from artist_videos where upload_token = ${old}`)).toEqual([]);
    expect(await query(sql`select id from uploads where id = ${oldRow.upload_id ?? ''}`)).toEqual(
      [],
    );
    expect(await disk('media').exists(oldRow.manifest_key ?? '')).toBe(false);
    expect(await disk('media').exists(oldRow.poster_key ?? '')).toBe(false);
    expect(await disk('originals').exists(oldUpload.object_key ?? '')).toBe(false);
    expect((await show(old)).status).toBe(404);
    // The one still uploading is kept, parts and all.
    const kept = await offsetOf(recent);
    expect(kept.status).toBe(200);
    expect(kept.headers.get('upload-offset')).toBe('3000');
    expect(await disk('quarantine').list(`video-parts/${recent}`)).not.toEqual([]);
  });

  /** A video file of `bytes` in all: the MP4 header, a marker the fake transcoder reads, then filler. */
  function video(bytes: number, marker = ''): Buffer {
    const head = Buffer.concat([MP4_HEAD, Buffer.from(marker)]);
    return Buffer.concat([head, Buffer.alloc(Math.max(0, bytes - head.length))]);
  }

  function start(title: string, fileName: string, size: number): Promise<Response> {
    return guest.json(VIDEOS, 'POST', { title, fileName, size });
  }

  async function startedToken(title: string, fileName: string, size: number): Promise<string> {
    const response = await start(title, fileName, size);
    expect(response.status).toBe(201);
    return ((await response.json()) as VideoBody).data.token;
  }

  function append(token: string, offset: number, chunk: Buffer): Promise<Response> {
    return guest.request(`${VIDEOS}/${token}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': CHUNK_TYPE,
        'Upload-Offset': String(offset),
        Accept: 'application/json',
      },
      body: new Uint8Array(chunk),
    });
  }

  function offsetOf(token: string): Promise<Response> {
    return guest.request(`${VIDEOS}/${token}`, {
      method: 'HEAD',
      headers: { Accept: 'application/json' },
    });
  }

  function show(token: string): Promise<Response> {
    return guest.json(`${VIDEOS}/${token}`, 'GET');
  }

  async function videoRow(token: string): Promise<VideoRow> {
    const rows = await query<VideoRow>(
      sql`select status::text as status, artist_id, upload_id, duration_seconds, manifest_key, poster_key
          from artist_videos where upload_token = ${token}`,
    );
    const [row] = rows;
    expect(rows).toHaveLength(1);
    if (row === undefined) throw new Error('No video row.');
    return row;
  }

  async function uploadRow(id: string): Promise<UploadRow> {
    const rows = await query<UploadRow>(
      sql`select id, detected_mime, status::text as status, user_id, quarantine_key, object_key from uploads where id = ${id}`,
    );
    const [row] = rows;
    expect(rows).toHaveLength(1);
    if (row === undefined) throw new Error('No upload row.');
    return row;
  }
});
