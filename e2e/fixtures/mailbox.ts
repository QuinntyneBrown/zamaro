import { expect } from '@playwright/test';

/**
 * Mailpit, which catches every email the e2e API sends (docker-compose.yml). Specs share it, so every
 * lookup filters by recipient; give each spec its own address (`uniqueEmail`).
 */
const MAILPIT = process.env['E2E_MAILPIT_URL'] ?? 'http://localhost:8026';

export interface Email {
  id: string;
  subject: string;
  from: string;
  to: string[];
  html: string;
  text: string;
}

interface Summary {
  ID: string;
}

interface Message {
  ID: string;
  Subject: string;
  From: { Address: string };
  To: { Address: string }[];
  HTML: string;
  Text: string;
}

/** Deletes every message: run once, before the suite. */
export async function clearMailbox(): Promise<void> {
  const response = await fetch(`${MAILPIT}/api/v1/messages`, { method: 'DELETE' });
  if (!response.ok) throw new Error(`Mailpit did not clear its inbox: ${response.status}`);
}

/** The emails sent to `address`, newest first. */
export async function emailsTo(address: string): Promise<Email[]> {
  const query = encodeURIComponent(`to:"${address}"`);
  const response = await fetch(`${MAILPIT}/api/v1/search?query=${query}`);
  const { messages } = (await response.json()) as { messages: Summary[] };
  return Promise.all(messages.map((summary) => read(summary.ID)));
}

/** Waits for an email to `address` whose subject matches, as queued mail can take a moment. */
export async function waitForEmail(address: string, subject: string | RegExp): Promise<Email> {
  let found: Email | undefined;
  await expect
    .poll(
      async () => {
        found = (await emailsTo(address)).find((email) =>
          typeof subject === 'string' ? email.subject === subject : subject.test(email.subject),
        );
        return found !== undefined;
      },
      { message: `an email to ${address} about ${subject}`, timeout: 15_000 },
    )
    .toBe(true);
  return found!;
}

/** The first link in an email's text part that starts with `prefix`, such as a verification link. */
export function linkIn(email: Email, prefix: string): string {
  const link = email.text
    .match(/https?:\/\/\S+/g)
    ?.find((url) => new URL(url).pathname.startsWith(prefix));
  if (!link) throw new Error(`No ${prefix} link in "${email.subject}".`);
  return link;
}

async function read(id: string): Promise<Email> {
  const response = await fetch(`${MAILPIT}/api/v1/message/${id}`);
  const message = (await response.json()) as Message;
  return {
    id: message.ID,
    subject: message.Subject,
    from: message.From.Address,
    to: message.To.map((recipient) => recipient.Address),
    html: message.HTML,
    text: message.Text,
  };
}
