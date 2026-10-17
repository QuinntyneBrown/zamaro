import { copy, firstName, sendTransactionalEmail, webUrl, type Recipient } from '../transactional';

/** The link that moves an account to a new address (L2-025.1), sent to that address; 24 hours, once. */
export function sendConfirmNewEmail(to: Recipient, token: string): Promise<void> {
  return sendTransactionalEmail({
    to,
    subject: copy('confirmEmail.subject'),
    blocks: [
      { kind: 'paragraph', text: copy('confirmEmail.greeting', { name: firstName(to.name) }) },
      { kind: 'paragraph', text: copy('confirmEmail.intro') },
      {
        kind: 'button',
        label: copy('confirmEmail.action'),
        url: webUrl('/account/email/confirm', { token }),
      },
      { kind: 'paragraph', text: copy('confirmEmail.expiry') },
      { kind: 'paragraph', text: copy('confirmEmail.ignore') },
    ],
  });
}
