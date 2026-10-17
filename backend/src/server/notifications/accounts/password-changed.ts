import type { DateTime } from 'luxon';
import {
  copy,
  emailDate,
  emailTime,
  firstName,
  sendTransactionalEmail,
  webUrl,
  type Recipient,
} from '../transactional';

/** The account's password was reset, and every other session ended (L2-023.4). */
export function sendPasswordChanged(to: Recipient, changedAt: DateTime): Promise<void> {
  return sendTransactionalEmail({
    to,
    subject: copy('passwordChanged.subject'),
    blocks: [
      { kind: 'paragraph', text: copy('passwordChanged.greeting', { name: firstName(to.name) }) },
      {
        kind: 'paragraph',
        text: copy('passwordChanged.intro', {
          email: to.email,
          date: emailDate(changedAt),
          time: emailTime(changedAt),
        }),
      },
      { kind: 'paragraph', text: copy('passwordChanged.notYou') },
      { kind: 'button', label: copy('passwordChanged.action'), url: webUrl('/forgot-password') },
    ],
  });
}
