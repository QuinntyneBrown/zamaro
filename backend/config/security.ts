import { z } from 'zod';

/**
 * Field encryption (L2-079.2, ADR-0020): phone numbers and other named columns are encrypted by the
 * API with a key that is never in the database. Each value starts with the version of the key that
 * wrote it; `previousKeys` lists earlier keys as `version:key` pairs, comma-separated, so their values
 * still read after a rotation.
 */
export interface SecurityConfig {
  fieldEncryption: {
    version: string;
    /** Raw 32-byte keys by version, the current one included. */
    keys: Map<string, Buffer>;
  };
}

const schema = z.object({
  FIELD_ENCRYPTION_KEY_VERSION: z.string().default('v1'),
  FIELD_ENCRYPTION_KEY: z.string().min(1, 'FIELD_ENCRYPTION_KEY is not set.'),
  FIELD_ENCRYPTION_PREVIOUS_KEYS: z.string().default(''),
});

let cached: SecurityConfig | undefined;

export function securityConfig(): SecurityConfig {
  cached ??= load();
  return cached;
}

export function reloadSecurityConfig(): void {
  cached = undefined;
}

function load(): SecurityConfig {
  const env = schema.parse(process.env);
  const keys = new Map<string, Buffer>();
  for (const pair of env.FIELD_ENCRYPTION_PREVIOUS_KEYS.split(',')) {
    const trimmed = pair.trim();
    if (trimmed === '') continue;
    const separator = trimmed.indexOf(':');
    keys.set(trimmed.slice(0, separator).trim(), decodeKey(trimmed.slice(separator + 1).trim()));
  }
  keys.set(env.FIELD_ENCRYPTION_KEY_VERSION, decodeKey(env.FIELD_ENCRYPTION_KEY));
  return { fieldEncryption: { version: env.FIELD_ENCRYPTION_KEY_VERSION, keys } };
}

function decodeKey(key: string): Buffer {
  const bytes = key.startsWith('base64:') ? Buffer.from(key.slice(7), 'base64') : Buffer.from(key);
  if (bytes.length !== 32) throw new Error('A field encryption key must be 32 bytes.');
  return bytes;
}
