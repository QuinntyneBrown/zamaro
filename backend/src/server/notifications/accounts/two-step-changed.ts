import { copy, firstName, sendTransactionalEmail, webUrl, type Recipient } from '../transactional';

/** Two-step sign-in was turned on or off, or its recovery codes replaced (M2 D21). */
export type TwoStepChange = 'on' | 'off' | 'codes';

export function sendTwoStepChanged(to: Recipient, change: TwoStepChange): Promise<void> {
  return sendTransactionalEmail({
    to,
    subject: copy(`twoStep.${change}.subject`),
    blocks: [
      { kind: 'paragraph', text: copy('twoStep.greeting', { name: firstName(to.name) }) },
      { kind: 'paragraph', text: copy(`twoStep.${change}.intro`, { email: to.email }) },
      { kind: 'paragraph', text: copy('twoStep.notYou') },
      { kind: 'button', label: copy('twoStep.action'), url: webUrl('/forgot-password') },
    ],
  });
}
