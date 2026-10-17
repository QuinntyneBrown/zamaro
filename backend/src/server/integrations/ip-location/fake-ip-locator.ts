import type { IpLocator } from '@/server/contracts/ip-locator';

/**
 * Deterministic locator for development and tests (ADR-0002, M2 D13): loopback and the 172.16/12 and
 * 192.168/16 private ranges are in Burlington, 10/8 in Hamilton, and every other address is unknown.
 */
export class FakeIpLocator implements IpLocator {
  private static readonly CITIES: [string, (ip: string) => boolean][] = [
    [
      'Burlington, ON',
      (ip) =>
        ip === '::1' ||
        ip.startsWith('127.') ||
        /^172\.(1[6-9]|2\d|3[01])\./.test(ip) ||
        ip.startsWith('192.168.'),
    ],
    ['Hamilton, ON', (ip) => ip.startsWith('10.')],
  ];

  city(ip: string | null): Promise<string | null> {
    if (ip === null) return Promise.resolve(null);
    const match = FakeIpLocator.CITIES.find(([, test]) => test(ip));
    return Promise.resolve(match?.[0] ?? null);
  }
}
