/**
 * "Chrome on Windows" from a browser's user agent, for the signed-in devices list (L2-025.3). Order
 * matters: Edge and Chrome both say "Safari", and every iPhone browser says "Mac OS X".
 */
const BROWSERS: [RegExp, string][] = [
  [/Edg(e|A|iOS)?\//, 'Edge'],
  [/(Firefox|FxiOS)\//, 'Firefox'],
  [/(Headless)?Chrome\/|CriOS\//, 'Chrome'],
  [/Version\/[\d.]+.*Safari\//, 'Safari'],
];

const SYSTEMS: [RegExp, string][] = [
  [/iPhone/, 'iPhone'],
  [/iPad/, 'iPad'],
  [/Android/, 'Android'],
  [/Windows NT/, 'Windows'],
  [/Macintosh|Mac OS X/, 'Mac'],
  [/CrOS/, 'ChromeOS'],
  [/Linux|X11/, 'Linux'],
];

export const UNKNOWN_DEVICE = 'Unknown device';

export function deviceLabel(agent: string | null): string {
  const browser = BROWSERS.find(([pattern]) => pattern.test(agent ?? ''))?.[1];
  const system = SYSTEMS.find(([pattern]) => pattern.test(agent ?? ''))?.[1];
  return browser !== undefined && system !== undefined ? `${browser} on ${system}` : UNKNOWN_DEVICE;
}
