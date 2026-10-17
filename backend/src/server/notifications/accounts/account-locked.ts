import type { DateTime } from 'luxon';
import {
  copy,
  emailTime,
  firstName,
  sendTransactionalEmail,
  webUrl,
  type Recipient,
} from '../transactional';

/** Sign-in for the account's address is paused after 5 failures; the owner is told once (L2-072.4). */
export function sendAccountLocked(to: Recipient, pausedUntil: DateTime): Promise<void> {
  return sendTransactionalEmail({
    to,
    subject: copy('locked.subject'),
    blocks: [
      { kind: 'paragraph', text: copy('locked.greeting', { name: firstName(to.name) }) },
      {
        kind: 'paragraph',
        text: copy('locked.intro', { email: to.email, time: emailTime(pausedUntil) }),
      },
      { kind: 'paragraph', text: copy('locked.wasYou') },
      { kind: 'button', label: copy('locked.action'), url: webUrl('/forgot-password') },
      { kind: 'paragraph', text: copy('locked.notYou') },
    ],
  });
}
