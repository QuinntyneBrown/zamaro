import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { config } from '@config/zamaro';

/**
 * Translation catalogues in resources/i18n/{locale}/{namespace}.json. A locale exists when its
 * directory does; English is complete and every other locale falls back to it per key (L2-111.2).
 */
export const FALLBACK_LOCALE = 'en';

export function hasCatalogue(locale: string): boolean {
  const path = localePath(locale);
  return /^[a-z]{2}(-[A-Z]{2})?$/.test(locale) && existsSync(path) && statSync(path).isDirectory();
}

/** Every message for the locale, keyed `{namespace}.{key}`, in key order. */
export function catalogueMessages(locale: string): Record<string, string> {
  const messages = load(FALLBACK_LOCALE);
  if (locale !== FALLBACK_LOCALE) Object.assign(messages, load(locale));
  return Object.fromEntries(
    Object.entries(messages).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
  );
}

function load(locale: string): Record<string, string> {
  const dir = localePath(locale);
  if (!existsSync(dir)) return {};
  const messages: Record<string, string> = {};
  for (const file of readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .sort()) {
    const namespace = file.slice(0, -'.json'.length);
    const parsed = JSON.parse(readFileSync(join(dir, file), 'utf8')) as Record<string, string>;
    for (const [key, message] of Object.entries(parsed)) {
      messages[`${namespace}.${key}`] = message;
    }
  }
  return messages;
}

function localePath(locale: string): string {
  return join(config().i18nPath, locale);
}
