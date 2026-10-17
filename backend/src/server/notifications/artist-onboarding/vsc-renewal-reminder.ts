import { DateTime } from 'luxon';
import { ZONE } from '@/server/support/clock';
import {
  copy,
  emailDate,
  firstName,
  sendTransactionalEmail,
  webUrl,
  type Recipient,
} from '../transactional';

/**
 * The artist's verified Vulnerable Sector Check runs out within 60 days: renew it from the profile
 * editor's check section to stay in Youth event searches (L2-049.3).
 */
export function sendVscRenewalReminder(to: Recipient, expiresOn: string): Promise<void> {
  const date = emailDate(DateTime.fromISO(expiresOn, { zone: ZONE }));
  return sendTransactionalEmail({
    to,
    subject: copy('vscRenewal.subject', { date }),
    blocks: [
      { kind: 'paragraph', text: copy('vscRenewal.greeting', { name: firstName(to.name) }) },
      { kind: 'paragraph', text: copy('vscRenewal.intro', { date }) },
      { kind: 'paragraph', text: copy('vscRenewal.renewBy', { date }) },
      { kind: 'button', label: copy('vscRenewal.action'), url: webUrl('/artist/profile#check') },
      { kind: 'paragraph', text: copy('vscRenewal.after') },
    ],
  });
}
