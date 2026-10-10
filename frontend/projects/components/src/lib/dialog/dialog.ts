import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Icon } from '../icon/icon';

/**
 * The dialog frame (docs/design-system/components/dialog): header with title and close button, then
 * the body. Open it with the CDK Dialog, which supplies the `role="dialog"` container, focus trap,
 * Escape and focus return; pass `titleId` as the dialog's `ariaLabelledBy`.
 */
@Component({
  selector: 'zm-dialog',
  imports: [Icon],
  host: {
    class: 'dialog',
    '[class.dialog--drawer]': "variant() === 'drawer'",
  },
  template: `<div class="dialog__header">
      <h2 class="dialog__title" [id]="titleId()">{{ heading() }}</h2>
      <button class="close" type="button" [attr.aria-label]="closeLabel()" (click)="closed.emit()">
        <zm-icon name="close" size="sm" />
      </button>
    </div>
    <div class="dialog__body"><ng-content /></div>`,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      width: min(100vw - var(--space-8), var(--layout-dialog-width));
      max-height: min(100dvh - var(--space-8), 48rem);
      overflow: hidden;
      background: var(--color-bg-surface-raised);
      color: var(--color-fg-default);
      border: var(--border-width-thick) solid var(--color-border-strong);
      box-shadow: var(--shadow-4);
      animation: dialog-in var(--duration-slow) var(--ease-enter);
    }

    :host(.dialog--drawer) {
      width: min(100vw, var(--layout-drawer-width));
      height: 100dvh;
      max-height: none;
      border: 0;
      border-right: var(--border-width-thick) solid var(--color-border-strong);
      box-shadow: none;
      animation-name: slide-in-left;
    }

    .dialog__header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: var(--space-4);
      padding: var(--space-6) var(--space-6) var(--space-4);
      border-bottom: var(--border-width-thick) dashed var(--color-border-strong);
    }

    .dialog__title {
      font: var(--text-h3);
      text-transform: uppercase;
    }

    .dialog__body {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
      padding: var(--space-5) var(--space-6);
      overflow-y: auto;
    }

    .close {
      display: grid;
      place-items: center;
      width: var(--control-height-sm);
      height: var(--control-height-sm);
      flex: none;
      border: 0;
      background: none;
      color: inherit;
      cursor: pointer;
    }

    .close:hover {
      background: color-mix(in srgb, currentColor 12%, transparent);
    }

    @media (pointer: coarse) {
      .close {
        width: var(--target-comfortable);
        height: var(--target-comfortable);
      }
    }

    /* XS (L2-099.2): a dialog fills the screen; only the body scrolls, so close stays reachable. */
    @media (max-width: 35.99rem) {
      :host {
        width: 100vw;
        height: 100dvh;
        max-height: none;
        border: 0;
        box-shadow: none;
      }

      .dialog__header {
        padding-top: calc(var(--space-6) + env(safe-area-inset-top));
      }

      .dialog__body {
        flex: 1 1 auto;
      }
    }

    @keyframes dialog-in {
      from {
        opacity: 0;
        translate: 0 var(--space-4);
      }
    }

    @keyframes slide-in-left {
      from {
        translate: -100% 0;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dialog {
  readonly heading = input.required<string>();
  readonly titleId = input.required<string>();
  readonly closeLabel = input.required<string>();
  readonly variant = input<'default' | 'drawer'>('default');

  readonly closed = output<void>();
}
