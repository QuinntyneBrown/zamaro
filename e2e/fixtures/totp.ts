import { createHmac } from 'node:crypto';

/**
 * RFC 6238 time-based one-time passwords, as an authenticator app computes them: HMAC-SHA1 over the
 * 30-second step, six digits. Two-step sign-in specs read the key from the setup page and compute
 * the code here.
 */
export function totp(base32Secret: string, at: Date = new Date(), stepSeconds = 30): string {
  const counter = Math.floor(at.getTime() / 1000 / stepSeconds);
  const message = Buffer.alloc(8);
  message.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac('sha1', decodeBase32(base32Secret)).update(message).digest();
  const offset = digest[digest.length - 1]! & 0x0f;
  const code = (digest.readUInt32BE(offset) & 0x7fffffff) % 1_000_000;
  return code.toString().padStart(6, '0');
}

/** RFC 4648 base32, ignoring spaces, case and padding as the setup page may show the key grouped. */
function decodeBase32(input: string): Buffer {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const clean = input.replace(/[\s=]/g, '').toUpperCase();
  let bits = '';
  for (const char of clean) {
    const value = alphabet.indexOf(char);
    if (value < 0) throw new Error(`"${char}" is not a base32 character.`);
    bits += value.toString(2).padStart(5, '0');
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}
