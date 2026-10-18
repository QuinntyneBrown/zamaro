import { copy, firstName, sendTransactionalEmail, webUrl, type Recipient } from '../transactional';

/**
 * The application is approved (L2-048.1, L2-063): the next step is payout setup, and the profile stays
 * out of search until it is done (L2-048.3). An applicant who had no account gets a link to choose a
 * password; one who had signs in.
 */
export function sendApplicationApproved(to: Recipient, resetToken: string | null): Promise<void> {
  return sendTransactionalEmail({
    to,
    subject: copy('applicationApproved.subject'),
    blocks: [
      {
        kind: 'paragraph',
        text: copy('applicationApproved.greeting', { name: firstName(to.name) }),
      },
      { kind: 'paragraph', text: copy('applicationApproved.intro') },
      { kind: 'paragraph', text: copy('applicationApproved.payouts') },
      resetToken === null
        ? { kind: 'button', label: copy('applicationApproved.signIn'), url: webUrl('/sign-in') }
        : {
            kind: 'button',
            label: copy('applicationApproved.setPassword'),
            url: webUrl(`/reset-password/${resetToken}`),
          },
      { kind: 'paragraph', text: copy('applicationApproved.hidden') },
    ],
  });
}
