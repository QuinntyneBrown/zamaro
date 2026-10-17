import { copy, firstName, sendTransactionalEmail, webUrl, type Recipient } from '../transactional';

/** The reset link asked for on the forgot-password page (L2-023.3); it works once, for 60 minutes. */
export function sendResetPassword(to: Recipient, token: string): Promise<void> {
  return sendTransactionalEmail({
    to,
    subject: copy('reset.subject'),
    blocks: [
      { kind: 'paragraph', text: copy('reset.greeting', { name: firstName(to.name) }) },
      { kind: 'paragraph', text: copy('reset.intro', { email: to.email }) },
      { kind: 'button', label: copy('reset.action'), url: webUrl(`/reset-password/${token}`) },
      { kind: 'paragraph', text: copy('reset.expiry') },
      { kind: 'paragraph', text: copy('reset.ignore') },
    ],
  });
}
