import {
  APPLICATION_REJECTION_REASON_LABELS,
  type ApplicationRejectionReason,
} from '@/server/enums';
import { copy, firstName, sendTransactionalEmail, type Recipient } from '../transactional';

/**
 * The application is rejected (L2-048.2, L2-063): the applicant reads the reason from the fixed
 * list and the administrator's note, when there is one.
 */
export function sendApplicationRejected(
  to: Recipient,
  number: string,
  decision: { reason: ApplicationRejectionReason; note: string | null },
): Promise<void> {
  return sendTransactionalEmail({
    to,
    subject: copy('applicationRejected.subject', { number }),
    blocks: [
      {
        kind: 'paragraph',
        text: copy('applicationRejected.greeting', { name: firstName(to.name) }),
      },
      { kind: 'paragraph', text: copy('applicationRejected.intro', { number }) },
      {
        kind: 'paragraph',
        text: copy('applicationRejected.reason', {
          reason: APPLICATION_REJECTION_REASON_LABELS[decision.reason],
        }),
      },
      ...(decision.note === null
        ? []
        : [
            {
              kind: 'paragraph' as const,
              text: copy('applicationRejected.note', { note: decision.note }),
            },
          ]),
      { kind: 'paragraph', text: copy('applicationRejected.again') },
    ],
  });
}
