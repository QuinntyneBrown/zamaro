import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { config } from '@config/zamaro';

/**
 * RFC 6238 codes for two-step sign-in (L2-072.3, ADR-0021): 30-second steps, six digits, and one
 * step either side accepted for a phone clock that is a little off. Codes follow the real clock,
 * never the frozen e2e one, as the person's authenticator app does.
 */
const WINDOW = 1;

/** A new base32 key of 32 characters (160 bits). */
export function newTotpSecret(): string {
  return authenticator.generateSecret(20);
}

/** The key in groups of four, as the setup page shows it: "JBSW Y3DP EHPK 3PXP …". */
export function groupedSecret(secret: string): string {
  return secret.match(/.{1,4}/g)?.join(' ') ?? secret;
}

/** The `otpauth://` address an authenticator app reads from the QR code. */
export function otpauthUri(email: string, secret: string): string {
  return authenticator.keyuri(email, config().appName, secret);
}

/** The QR code of the address as SVG, for the setup page's image. */
export function qrSvg(uri: string): Promise<string> {
  return QRCode.toString(uri, { type: 'svg', margin: 1, width: 192 });
}

export function verifyTotp(secret: string, code: string): boolean {
  const digits = code.replace(/\s/g, '');
  if (!/^\d{6}$/.test(digits)) return false;
  authenticator.options = { window: WINDOW };
  return authenticator.check(digits, secret);
}

/** Six digits, as a code from the app is; anything else is taken for a recovery code. */
export function looksLikeTotp(code: string): boolean {
  return /^\s*\d{6}\s*$/.test(code);
}
