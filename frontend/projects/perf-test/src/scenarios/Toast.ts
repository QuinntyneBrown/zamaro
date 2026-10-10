import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastRegion, ToastService } from 'components';

/**
 * One timed success toast in the region: "Saved Luz Viva" with its count and the timer bar
 * (docs/mocks/notifications/saved-toast/success). Its Undo joins when toasts gain actions (M2). Each
 * render has its own service, so toasts never pile up between renders.
 */
@Component({
  selector: 'zm-toast-scenario',
  imports: [ToastRegion],
  providers: [ToastService],
  template: `<zm-toast-region />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ToastScenario {
  constructor() {
    inject(ToastService).show({
      kind: 'Saved',
      title: 'Saved Luz Viva',
      text: 'Your saved count is now 3.',
      icon: 'check',
      dismissLabel: 'Dismiss: Saved Luz Viva',
    });
  }
}
