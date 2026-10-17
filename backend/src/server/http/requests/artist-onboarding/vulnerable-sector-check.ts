import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { today } from '@/server/support/clock';
import { ValidationProblem } from '@/server/support/problems';
import { errorsOf } from '../../validation';

/** The check's file and issue date (verify-vulnerable-sector-check, M3 D11 copy). */
export const MAX_CHECK_BYTES = 10 * 1024 * 1024;

const ISSUED_ON = 'Enter the issue date printed on the check.';
const CHOOSE_FILE = 'Choose the scan of your check.';

/** The form's fields as the OpenAPI document describes the multipart body. */
export const UploadVulnerableSectorCheckRequest = z.object({
  /** The scan of the whole check: a PDF, JPEG or PNG up to 10 MB, typed by its content. */
  file: z.string().describe('binary'),
  /** `YYYY-MM-DD`, printed on the check; today at the latest. */
  issuedOn: z.iso.date(),
});

const IssuedOn = z.iso.date({ error: ISSUED_ON }).refine((date) => date <= today(), {
  error: 'The issue date can’t be after today.',
});

export interface CheckUpload {
  bytes: Buffer;
  issuedOn: string;
}

/**
 * Reads the multipart form: the file and the issue date, each checked before the content is looked
 * at. A JSON body has no file, so it is refused on `file`.
 */
export async function parseCheckUpload(request: NextRequest): Promise<CheckUpload> {
  const errors: Record<string, string[]> = {};
  const form = await formOf(request);
  const file = form?.get('file');
  const issuedOnInput = form?.get('issuedOn');

  let bytes: Buffer | null = null;
  if (!(file instanceof File) || file.size === 0) {
    errors.file = [CHOOSE_FILE];
  } else if (file.size > MAX_CHECK_BYTES) {
    const megabytes = Math.round(file.size / 1_048_576);
    errors.file = [`This file is ${String(megabytes)} MB. Choose a PDF, JPEG or PNG up to 10 MB.`];
  } else {
    bytes = Buffer.from(await file.arrayBuffer());
  }

  const issuedOn = IssuedOn.safeParse(
    typeof issuedOnInput === 'string' ? issuedOnInput : undefined,
  );
  if (!issuedOn.success) Object.assign(errors, errorsOf(issuedOn.error, { '': 'issuedOn' }));

  if (Object.keys(errors).length > 0 || bytes === null || !issuedOn.success) {
    throw new ValidationProblem(errors);
  }
  return { bytes, issuedOn: issuedOn.data };
}

async function formOf(request: NextRequest): Promise<FormData | null> {
  const type = request.headers.get('content-type') ?? '';
  if (!type.startsWith('multipart/form-data')) return null;
  try {
    return await request.formData();
  } catch {
    return null;
  }
}
