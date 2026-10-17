import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { securityConfig } from '@config/security';

/**
 * Application-level encryption of named columns (L2-079.2, ADR-0020, ADR-0027): AES-256-GCM with
 * the field key, never any app key. A stored value is `{version}:{base64(iv || tag || ciphertext)}`,
 * so values written under a previous key still decrypt while new ones use the current key.
 */
const IV_BYTES = 12;
const TAG_BYTES = 16;

export class FieldCipherError extends Error {}

export function encryptField(plain: string): string {
  const { version, keys } = securityConfig().fieldEncryption;
  const key = keys.get(version);
  if (key === undefined) throw new FieldCipherError(`No field key for version ${version}.`);
  return `${version}:${seal(Buffer.from(plain, 'utf8'), key).toString('base64')}`;
}

/** @throws FieldCipherError when the value names a key this API does not hold, or was tampered with */
export function decryptField(stored: string): string {
  const separator = stored.indexOf(':');
  const version = stored.slice(0, separator);
  const key = securityConfig().fieldEncryption.keys.get(version);
  if (separator < 0 || key === undefined) {
    throw new FieldCipherError(`No field key for version ${version}.`);
  }
  return open(Buffer.from(stored.slice(separator + 1), 'base64'), key).toString('utf8');
}

/** AES-256-GCM with a fresh IV: `iv || tag || ciphertext`. Shared with the document vault (ADR-0025). */
export function seal(plain: Buffer, key: Buffer): Buffer {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv('aes-256-gcm', key, iv, { authTagLength: TAG_BYTES });
  const ciphertext = Buffer.concat([cipher.update(plain), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]);
}

export function open(sealed: Buffer, key: Buffer): Buffer {
  if (sealed.length < IV_BYTES + TAG_BYTES) throw new FieldCipherError('The value is too short.');
  const iv = sealed.subarray(0, IV_BYTES);
  const tag = sealed.subarray(IV_BYTES, IV_BYTES + TAG_BYTES);
  const decipher = createDecipheriv('aes-256-gcm', key, iv, { authTagLength: TAG_BYTES });
  decipher.setAuthTag(tag);
  try {
    return Buffer.concat([
      decipher.update(sealed.subarray(IV_BYTES + TAG_BYTES)),
      decipher.final(),
    ]);
  } catch {
    throw new FieldCipherError('The value could not be decrypted.');
  }
}
