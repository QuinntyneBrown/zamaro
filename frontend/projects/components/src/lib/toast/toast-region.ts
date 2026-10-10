import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Toast } from './toast';
import { ToastService } from './toast.service';

/**
 * The one polite status region every toast is read from (docs/specs/components/toast.md). Each
 * application shell renders it once, last, so it exists before any toast is raised (L2-102). A page
 * with a sticky bottom bar raises it with `--zm-toast-offset`.
 */
@Component({
  selector: 'zm-toast-region',
  imports: [Toast],
  host: { class: 'toast-region', role: 'status', 'aria-live': 'polite' },
  template: `@for (toast of toasts.visible(); track toast.id) {
    <zm-toast
      [toast]="toast.content()"
      [run]="toast.run()"
      [state]="toast.state()"
      [paused]="toast.paused()"
      [origin]="toast.origin"
      (closed)="toasts.close(toast, 'close')"
      (held)="toasts.hold(toast, $event)"
      (left)="toasts.remove(toast)"
    />
  }`,
  styles: `
    :host {
      position: fixed;
      z-index: var(--z-toast);
      left: var(--space-4);
      right: var(--space-4);
      bottom: calc(var(--space-4) + env(safe-area-inset-bottom) + var(--zm-toast-offset, 0px));
      display: grid;
      gap: var(--space-2);
      pointer-events: none;
    }

    @media (min-width: 36rem) {
      :host {
        left: auto;
        right: var(--space-6);
        bottom: calc(var(--space-6) + var(--zm-toast-offset, 0px));
        width: 24rem;
      }
    }

    @media print {
      :host {
        display: none;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastRegion {
  protected readonly toasts = inject(ToastService);
}
