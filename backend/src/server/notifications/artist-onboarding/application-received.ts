import type { DateTime } from 'luxon';
import { ZONE } from '@/server/support/clock';
import { copy, firstName, sendTransactionalEmail, webUrl, type Recipient } from '../transactional';

/** The application is in: its number, what happens next and when a reply comes (L2-047.1, L2-063). */
export function sendApplicationReceived(
  to: Recipient,
  number: string,
  replyBy: DateTime,
): Promise<void> {
  const date = replyBy.setZone(ZONE).setLocale('en-CA').toFormat('EEE d MMM');
  return sendTransactionalEmail({
    to,
    subject: copy('applicationReceived.subject', { number }),
    blocks: [
      {
        kind: 'paragraph',
        text: copy('applicationReceived.greeting', { name: firstName(to.name) }),
      },
      { kind: 'paragraph', text: copy('applicationReceived.intro', { number, replyBy: date }) },
      { kind: 'paragraph', text: copy('applicationReceived.next') },
      { kind: 'button', label: copy('applicationReceived.action'), url: webUrl('/') },
      { kind: 'paragraph', text: copy('applicationReceived.questions', { number }) },
    ],
  });
}
