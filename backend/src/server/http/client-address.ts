import type { NextRequest } from 'next/server';
import { config } from '@config/zamaro';

/**
 * The client's address for rate limits and the audit log. A Next.js route handler never sees the
 * socket, so the address comes from `X-Forwarded-For`, which the load balancer and Zamaro Web's
 * server set; walking it from the right, the first address that is not a trusted proxy
 * (TRUSTED_PROXIES, exact or CIDR) is the client. Without the header the caller is local.
 */
export function clientAddress(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded === null || forwarded.trim() === '') return '127.0.0.1';
  const addresses = forwarded
    .split(',')
    .map((address) => address.trim())
    .filter((address) => address !== '');
  const trusted = config().trustedProxies;
  for (const address of [...addresses].reverse()) {
    if (!trusted.some((proxy) => matches(address, proxy))) return address;
  }
  return addresses[0] ?? '127.0.0.1';
}

function matches(address: string, proxy: string): boolean {
  if (!proxy.includes('/')) return address === proxy;
  const [network, bitsText] = proxy.split('/');
  const bits = Number(bitsText);
  const a = ipv4(address);
  const n = ipv4(network ?? '');
  if (a === undefined || n === undefined || !Number.isInteger(bits)) return false;
  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
  return (a & mask) >>> 0 === (n & mask) >>> 0;
}

function ipv4(address: string): number | undefined {
  const parts = address.split('.').map(Number);
  if (
    parts.length !== 4 ||
    parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)
  ) {
    return undefined;
  }
  return parts.reduce((total, part) => ((total << 8) | part) >>> 0, 0);
}
