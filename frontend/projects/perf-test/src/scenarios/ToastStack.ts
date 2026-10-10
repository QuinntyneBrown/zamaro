import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastRegion, ToastService } from 'components';

/**
 * Composite: three toasts stacked in the region, newest on top
 * (docs/mocks/notifications/booking-toast/stacked). "Pay deposit" joins when toasts gain actions (M5).
 */
@Component({
  selector: 'zm-toast-stack-scenario',
  imports: [ToastRegion],
  providers: [ToastService],
  template: `<zm-toast-region />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ToastStackScenario {
  constructor() {
    const toasts = inject(ToastService);
    toasts.show({
      variant: 'warning',
      kind: 'Heads up',
      title: 'Luz Viva deposit due',
      text: 'Pay your $225 deposit for Luz Viva by Sat 10 Oct, 4:00 p.m. or the booking expires.',
      dismissLabel: 'Dismiss: Luz Viva deposit due',
    });
    toasts.show({
      variant: 'info',
      kind: 'Info',
      title: 'Message sent to Abigail',
      text: 'It’s on ZAM-0114. She gets an email about new messages at most every 15 minutes.',
      dismissLabel: 'Dismiss: Message sent to Abigail',
    });
    toasts.show({
      kind: 'Accepted',
      title: 'Abigail accepted',
      text: 'Pay the $162.50 deposit by Sun 11 Oct, 2:40 p.m. to confirm Sat 14 Nov.',
      dismissLabel: 'Dismiss: Abigail accepted',
    });
  }
}
