import { createHash, randomBytes } from 'node:crypto';
import { config } from '@config/zamaro';
import { decryptField, encryptField } from '@/server/support/encryption/field-cipher';

/** A feed token: 32 random bytes as base64url, 43 characters without padding. */
export const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export interface FeedToken {
  /** The secret itself, which only the link carries. */
  token: string;
  /** Its SHA-256, hex, the only form looked up. */
  hash: string;
  /** An application-encrypted copy, so the artist can be shown the link again. */
  encrypted: string;
}

export function newFeedToken(): FeedToken {
  const token = randomBytes(32).toString('base64url');
  return { token, hash: hashFeedToken(token), encrypted: encryptField(token) };
}

export function hashFeedToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** The secret link the calendar application subscribes to. */
export function feedUrl(token: string): string {
  return `${config().appUrl}/api/v1/calendar-feeds/${token}.ics`;
}

export function feedUrlFromEncrypted(encrypted: string): string {
  return feedUrl(decryptField(encrypted));
}
