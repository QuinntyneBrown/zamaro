import { UploadPurpose } from '@/server/enums';

/**
 * What a file really is (L2-076.1): its type from its leading bytes, never from its name or the
 * declared type. SVG, HTML and XHTML are refused in any form, and so is any file whose first bytes
 * look like XML or HTML, whatever it is called or meant for.
 */
const SIGNATURES: [(head: Buffer) => boolean, string][] = [
  [(head) => head.subarray(0, 4).toString('latin1') === '%PDF', 'application/pdf'],
  [
    (head) =>
      head.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
    'image/png',
  ],
  [(head) => head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff, 'image/jpeg'],
  [
    (head) =>
      head.subarray(0, 4).toString('latin1') === 'RIFF' &&
      head.subarray(8, 12).toString('latin1') === 'WEBP',
    'image/webp',
  ],
  [
    (head) =>
      head.subarray(4, 8).toString('latin1') === 'ftyp' &&
      /^(heic|heix|hevc|mif1|msf1)/.test(head.subarray(8, 12).toString('latin1')),
    'image/heic',
  ],
  [
    (head) =>
      head.subarray(4, 8).toString('latin1') === 'ftyp' &&
      head.subarray(8, 10).toString('latin1') === 'qt',
    'video/quicktime',
  ],
  [(head) => head.subarray(4, 8).toString('latin1') === 'ftyp', 'video/mp4'],
  [(head) => head.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3])), 'video/webm'],
  [
    (head) => head.subarray(0, 6).toString('utf8').replace(/^﻿/, '').startsWith('WEBVTT'),
    'text/vtt',
  ],
];

/** The detected type, or null when the file is refused outright. */
export function detectContentType(bytes: Buffer): string | null {
  const head = bytes.subarray(0, 4096);
  if (looksLikeMarkup(head)) return null;
  for (const [matches, type] of SIGNATURES) {
    if (matches(head)) return type;
  }
  return 'application/octet-stream';
}

/** The first bytes, past any BOM and whitespace, open a tag. */
function looksLikeMarkup(head: Buffer): boolean {
  const text = head.toString('utf8').replace(/^﻿/, '').trimStart();
  return text.startsWith('<');
}

/** The content types the purpose accepts (scan-and-serve-uploads). */
export function allowedTypes(purpose: UploadPurpose): string[] {
  switch (purpose) {
    case UploadPurpose.VscDocument:
      return ['application/pdf', 'image/jpeg', 'image/png'];
    case UploadPurpose.Photo:
      return ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
    case UploadPurpose.Video:
      return ['video/mp4', 'video/quicktime', 'video/webm'];
    case UploadPurpose.Caption:
      return ['text/vtt'];
  }
}

/** What the person reads when the file is not one of those types (M3 D11). */
export function wrongTypeMessage(purpose: UploadPurpose): string {
  switch (purpose) {
    case UploadPurpose.VscDocument:
      return 'This file isn’t a PDF, JPEG or PNG. Choose a scan of the whole check.';
    case UploadPurpose.Photo:
      return 'This file isn’t a JPEG, PNG, WebP or HEIC photo.';
    case UploadPurpose.Video:
      return 'This file isn’t an MP4, MOV or WebM video.';
    case UploadPurpose.Caption:
      return 'This file isn’t a WebVTT caption file.';
  }
}
