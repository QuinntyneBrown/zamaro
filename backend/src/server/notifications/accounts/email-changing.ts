import { copy, firstName, sendTransactionalEmail, webUrl, type Recipient } from '../transactional';

/** Told to the address an account signs in with when a new one is asked for (L2-025.1). */
export function sendEmailChanging(to: Recipient, newEmail: string): Promise<void> {
  return sendTransactionalEmail({
    to,
    subject: copy('emailChanging.subject'),
    blocks: [
      { kind: 'paragraph', text: copy('emailChanging.greeting', { name: firstName(to.name) }) },
      { kind: 'paragraph', text: copy('emailChanging.intro', { email: newEmail }) },
      { kind: 'paragraph', text: copy('emailChanging.stays', { email: to.email }) },
      { kind: 'paragraph', text: copy('emailChanging.notYou') },
      { kind: 'button', label: copy('emailChanging.action'), url: webUrl('/forgot-password') },
    ],
  });
}
