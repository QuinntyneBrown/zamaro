import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { UploadPurpose } from '@/server/enums';
import { allowedTypes, detectContentType } from '@/server/services/security/content-type-detector';
import { ABIGAIL, Browser, signedIn } from '../../support/accounts';
import { resetClock } from '../../support/clock';
import { closeDatabase, freshDatabase } from '../../support/database';
import { holdJobs } from '../../support/jobs';

const CHECKS = '/api/v1/artist/vulnerable-sector-checks';

/**
 * L2-075.4, L2-076.1 (security/scan-and-serve-uploads): upload routes take a multipart body up to
 * their own limit while every other route keeps the 1 MB JSON limit, and a file's type comes from its
 * content, with markup refused whatever it is called.
 */
describe('scanning and serving uploads', () => {
  let abigail: Browser;

  beforeAll(async () => {
    await freshDatabase();
  });

  afterAll(closeDatabase);

  beforeEach(async () => {
    await freshDatabase();
    resetClock();
    holdJobs();
    abigail = await signedIn(ABIGAIL);
  });

  it('lets only upload routes take a body over 1 MB', async () => {
    const big = await abigail.json('/api/v1/account/profile', 'PUT', {
      name: 'a'.repeat(2 * 1024 * 1024),
    });
    expect(big.status).toBe(413);

    const form = new FormData();
    form.set('file', new File(['%PDF-1.4\n'.padEnd(2 * 1024 * 1024, '0')], 'check.pdf'));
    form.set('issuedOn', '2026-10-05');
    const uploaded = await abigail.request(CHECKS, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: form,
    });
    expect(uploaded.status).toBe(202);

    // A JSON body on the upload route is not refused as a type: it simply has no file.
    const json = await abigail.json(CHECKS, 'POST', { issuedOn: '2026-10-05' });
    expect(json.status).toBe(422);
    expect(((await json.json()) as { errors: object }).errors).toHaveProperty('file');
  });

  it('types a file by its bytes and refuses markup in any form', () => {
    expect(detectContentType(Buffer.from('%PDF-1.4\n%%EOF'))).toBe('application/pdf');
    expect(
      detectContentType(
        Buffer.concat([
          Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0x0d]),
          Buffer.from('IHDR'),
          Buffer.alloc(64),
        ]),
      ),
    ).toBe('image/png');
    expect(
      detectContentType(
        Buffer.concat([
          Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]),
          Buffer.from('JFIF\0\x01\x01'),
          Buffer.alloc(64),
        ]),
      ),
    ).toBe('image/jpeg');
    expect(
      detectContentType(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>')),
    ).toBeNull();
    expect(detectContentType(Buffer.from('﻿ \n\t<!DOCTYPE html><html></html>'))).toBeNull();
    expect(detectContentType(Buffer.from('<?xml version="1.0"?><root/>'))).toBeNull();
    expect(allowedTypes(UploadPurpose.VscDocument)).toEqual([
      'application/pdf',
      'image/jpeg',
      'image/png',
    ]);
  });
});
