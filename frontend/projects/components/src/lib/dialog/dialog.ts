import { booleanAttribute, ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Icon, type IconName } from '../icon/icon';

/**
 * The dialog frame (docs/design-system/components/dialog): header with an optional kicker, the
 * title and close button, then the body and the `[slot=footer]` actions. Open it with the CDK Dialog, which supplies the `role="dialog"` container, focus trap,
 * Escape and focus return; pass `titleId` as the dialog's `ariaLabelledBy`. The `menu` variant is
 * the account menu under the avatar: the title is visually hidden and there is no close button or
 * footer. It changes only styles, so the frame renders the same nodes in every variant.
 */
@Component({
  selector: 'zm-dialog',
  imports: [Icon],
  host: {
    class: 'dialog',
    '[class.dialog--drawer]': "variant() === 'drawer'",
    '[class.dialog--menu]': "variant() === 'menu'",
    '[class.dialog--danger]': 'danger()',
    '[attr.aria-busy]': "busy() ? 'true' : null",
  },
  template: `<div class="dialog__header">
      @if (icon(); as name) {
        <div
          class="dialog__icon"
          [class.dialog__icon--danger]="iconTone() === 'danger'"
          [class.dialog__icon--info]="iconTone() === 'info'"
          aria-hidden="true"
        >
          <zm-icon [name]="name" />
        </div>
      }
      <div>
        @if (kicker()) {
          <span class="dialog__kicker">{{ kicker() }}</span>
        }
        <h2 class="dialog__title" [id]="titleId()">{{ heading() }}</h2>
        @if (description()) {
          <p class="dialog__description" [id]="descriptionId() || titleId() + '-desc'">
            {{ description() }}
          </p>
        }
      </div>
      <button
        class="close"
        type="button"
        [attr.aria-label]="closeLabel()"
        [disabled]="busy()"
        (click)="closed.emit()"
      >
        <zm-icon name="close" size="sm" />
      </button>
    </div>
    <div class="dialog__body"><ng-content /></div>
    <div class="dialog__footer"><ng-content select="[slot=footer]" /></div>`,
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

    /* Hangs under the top bar's right edge with no dim, at every width (dialog CRD, menu variant). */
    :host(.dialog--menu) {
      width: var(--layout-menu-width);
      height: auto;
      max-width: calc(100vw - var(--layout-margin) * 2);
      max-height: calc(100dvh - var(--layout-topbar-height) - var(--space-4));
      overflow-y: auto;
      padding: var(--space-2);
      border: var(--border-width-thick) solid var(--color-border-strong);
      box-shadow: var(--shadow-2);
      animation-name: scale-in;
      transform-origin: top right;
    }

    /* The header and body add no box of their own; the title names the dialog, unseen. */
    :host(.dialog--menu) .dialog__header,
    :host(.dialog--menu) .dialog__header > div,
    :host(.dialog--menu) .dialog__body {
      display: contents;
    }

    :host(.dialog--menu) .dialog__title {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0 0 0 0);
      white-space: nowrap;
    }

    :host(.dialog--menu) .close,
    :host(.dialog--menu) .dialog__footer {
      display: none;
    }

    .dialog__header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: var(--space-4);
      padding: var(--space-6) var(--space-6) var(--space-4);
      border-bottom: var(--border-width-thick) dashed var(--color-border-strong);
    }

    .dialog__header > div {
      flex: 1;
      min-width: 0;
    }

    :host(.dialog--danger) .dialog__header {
      border-top: var(--border-width-poster) solid var(--color-danger-solid);
    }
    .dialog__icon {
      display: grid;
      place-items: center;
      width: 2.5rem;
      height: 2.5rem;
      flex: none;
      border: var(--border-width-thick) solid currentColor;
    }
    .dialog__icon--info {
      color: var(--color-info-icon);
      background: var(--color-info-bg);
    }
    .dialog__icon--danger {
      color: var(--color-danger-icon);
      background: var(--color-danger-bg);
    }
    .dialog__description {
      margin-top: var(--space-1);
      color: var(--color-fg-muted);
    }
    :host([aria-busy='true']) .dialog__body {
      opacity: 0.6;
    }
    .dialog__kicker {
      display: block;
      margin-bottom: var(--space-1);
      font: var(--text-overline);
      letter-spacing: var(--letter-spacing-stamp);
      text-transform: uppercase;
    }

    .dialog__title {
      font: var(--text-h3);
      text-transform: uppercase;
    }

    .dialog__footer {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: var(--space-3);
      padding: var(--space-4) var(--space-6) var(--space-6);
    }

    .dialog__footer:empty {
      display: none;
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

      .dialog__footer {
        position: sticky;
        bottom: 0;
        background: var(--color-bg-surface-raised);
        padding-bottom: calc(var(--space-6) + env(safe-area-inset-bottom));
      }
    }

    @keyframes dialog-in {
      from {
        opacity: 0;
        translate: 0 var(--space-4);
      }
    }

    @keyframes scale-in {
      from {
        opacity: 0;
        scale: 0.96;
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
  /** The close button's name; the menu variant has no close button. */
  readonly closeLabel = input('');
  /** The context above the title: "Abigail Mensah · Photos". */
  readonly kicker = input('');
  readonly variant = input<'default' | 'drawer' | 'menu'>('default');
  /** The consequence under the title, which names the dialog's description. */
  readonly description = input('');
  /** The description's `id`; defaults to `{titleId}-desc`. */
  readonly descriptionId = input('');
  /** An icon in the framed square before the title. */
  readonly icon = input<IconName | null>(null);
  readonly iconTone = input<'info' | 'danger'>('info');
  /** The red rule across the top: an action that cannot be undone. */
  readonly danger = input(false, { transform: booleanAttribute });
  /** A request is out: the body dims and the close button is disabled. */
  readonly busy = input(false, { transform: booleanAttribute });

  readonly closed = output<void>();
}
