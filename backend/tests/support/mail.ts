import { expect } from 'vitest';
import type { EmailMessage } from '@/server/contracts/mailer';
import { mailer } from '@/server/integrations/bindings';
import { FakeMailer } from '@/server/integrations/mail/fake-mailer';

/** Every email the API sent since the database was made fresh. */
export function sentEmails(): EmailMessage[] {
  const bound = mailer();
  if (!(bound instanceof FakeMailer)) throw new Error('The test suite binds the fake mailer.');
  return bound.sent;
}

export function onlySentEmail(): EmailMessage {
  const [first, ...rest] = sentEmails();
  expect(rest, 'one email was sent').toHaveLength(0);
  if (first === undefined) throw new Error('No email was sent.');
  return first;
}

export function emailsTo(address: string): EmailMessage[] {
  return sentEmails().filter((message) => message.to.address === address);
}
