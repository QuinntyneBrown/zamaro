import { config } from '@config/zamaro';
import type { EmailMessage } from '@/server/contracts/mailer';
import { mailer } from '@/server/integrations/bindings';
import { catalogueMessages } from '@/server/services/user-experience/catalogue';
import { ZONE } from '@/server/support/clock';
import type { DateTime } from 'luxon';

/**
 * Every Zamaro email (notifications/send-transactional-emails, ADR-0019): sent from Zamaro
 * <hello@zamaro.ca> (M2 D16) with HTML and text parts, every word from the `emails` catalogue
 * (L2-111). The blocks below are the whole vocabulary of a Zamaro email: paragraphs and buttons
 * between the site's header and footer.
 */
export type EmailBlock =
  | { kind: 'paragraph'; text: string }
  | { kind: 'button'; label: string; url: string }
  | { kind: 'link'; text: string; label: string; url: string };

export interface Recipient {
  name: string;
  email: string;
}

export interface TransactionalEmail {
  to: Recipient;
  subject: string;
  blocks: EmailBlock[];
}

export async function sendTransactionalEmail(email: TransactionalEmail): Promise<void> {
  await mailer().send(buildMessage(email));
}

export function buildMessage(email: TransactionalEmail): EmailMessage {
  const { mail } = config();
  return {
    from: { name: mail.fromName, address: mail.fromAddress },
    to: { name: email.to.name, address: email.to.email },
    subject: email.subject,
    html: renderHtml(email),
    text: renderText(email),
  };
}

/** A line of the `emails` catalogue with its `{param}`s filled in. */
export function copy(key: string, params: Record<string, string> = {}): string {
  const message = catalogueMessages('en')[`emails.${key}`];
  if (message === undefined) throw new Error(`No emails.${key} in the catalogue.`);
  return message.replace(/\{(\w+)\}/g, (match, name: string) => params[name] ?? match);
}

/** An address on Zamaro Web; emails are sent with no request to take the origin from. */
export function webUrl(path: string, query?: Record<string, string>): string {
  const base = `${config().webUrl}${path}`;
  if (query === undefined) return base;
  return `${base}?${new URLSearchParams(query).toString()}`;
}

/** "Naomi" from "Naomi Fraser", for the greeting. */
export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

/** A date as the site writes it, in Toronto: "Fri 9 Oct 2026" (L2-110). */
export function emailDate(at: DateTime): string {
  return at.setZone(ZONE).setLocale('en-CA').toFormat('EEE d MMM yyyy');
}

/** A time as the site writes it, in Toronto: "10:57 a.m." (L2-110). */
export function emailTime(at: DateTime): string {
  return at
    .setZone(ZONE)
    .setLocale('en-CA')
    .toFormat('h:mm a')
    .replace(/AM|PM/, (m) => (m === 'AM' ? 'a.m.' : 'p.m.'));
}

function renderText(email: TransactionalEmail): string {
  const lines = email.blocks.map((block) => {
    switch (block.kind) {
      case 'paragraph':
        return block.text;
      case 'button':
        return `${block.label}: ${block.url}`;
      case 'link':
        return `${block.text} ${block.label}: ${block.url}`;
    }
  });
  return [config().appName, ...lines, copy('footer')].join('\n\n') + '\n';
}

function renderHtml(email: TransactionalEmail): string {
  const body = email.blocks
    .map((block) => {
      switch (block.kind) {
        case 'paragraph':
          return `<p>${escapeHtml(block.text)}</p>`;
        case 'button':
          return `<p><a class="button" href="${escapeHtml(block.url)}">${escapeHtml(block.label)}</a></p>`;
        case 'link':
          return `<p>${escapeHtml(block.text)} <a href="${escapeHtml(block.url)}">${escapeHtml(block.label)}</a></p>`;
      }
    })
    .join('\n');
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>${escapeHtml(email.subject)}</title></head>
<body>
<header><a href="${escapeHtml(webUrl('/'))}">${escapeHtml(config().appName)}</a></header>
<main>
${body}
</main>
<footer><p>${escapeHtml(copy('footer'))}</p></footer>
</body>
</html>
`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
