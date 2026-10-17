import type { DateTime } from 'luxon';
import {
  copy,
  emailDate,
  firstName,
  sendTransactionalEmail,
  webUrl,
  type Recipient,
} from '../transactional';

/** Someone registered with an address that already has an account; its owner is told (L2-022.2). */
export function sendDuplicateSignUp(to: Recipient, attemptedAt: DateTime): Promise<void> {
  return sendTransactionalEmail({
    to,
    subject: copy('duplicate.subject'),
    blocks: [
      { kind: 'paragraph', text: copy('duplicate.greeting', { name: firstName(to.name) }) },
      {
        kind: 'paragraph',
        text: copy('duplicate.intro', { email: to.email, date: emailDate(attemptedAt) }),
      },
      { kind: 'paragraph', text: copy('duplicate.signIn') },
      { kind: 'button', label: copy('duplicate.action'), url: webUrl('/sign-in') },
      {
        kind: 'link',
        text: copy('duplicate.forgot'),
        label: copy('duplicate.forgotAction'),
        url: webUrl('/forgot-password'),
      },
      { kind: 'paragraph', text: copy('duplicate.ignore') },
    ],
  });
}
