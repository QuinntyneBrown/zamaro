import { copy, firstName, sendTransactionalEmail, webUrl, type Recipient } from '../transactional';

/** The verification link sent at registration (L2-022.1); it works once, for 24 hours. */
export function sendVerifyEmail(to: Recipient, token: string, returnUrl: string): Promise<void> {
  return sendTransactionalEmail({
    to,
    subject: copy('verify.subject'),
    blocks: [
      { kind: 'paragraph', text: copy('verify.greeting', { name: firstName(to.name) }) },
      { kind: 'paragraph', text: copy('verify.intro') },
      {
        kind: 'button',
        label: copy('verify.action'),
        url: webUrl('/verify-email', { token, returnUrl }),
      },
      { kind: 'paragraph', text: copy('verify.expiry') },
      { kind: 'paragraph', text: copy('verify.ignore') },
    ],
  });
}
