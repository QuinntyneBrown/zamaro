import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Icon, type IconName } from '../icon/icon';

export type FormActionsTone = 'neutral' | 'success' | 'danger';

/**
 * The save bar (docs/specs/components/form-layout): a status line on the left, announced politely as
 * it changes, and the projected buttons on the right. Sticky to the bottom of the viewport, or in the
 * flow with `placement="static"`.
 */
@Component({
  selector: 'zm-form-actions',
  imports: [Icon],
  host: {
    class: 'form-actions',
    '[class.form-actions--static]': "placement() === 'static'",
  },
  template: `<span
      class="form-actions__status"
      role="status"
      [class.form-actions__status--success]="statusTone() === 'success'"
      [class.form-actions__status--danger]="statusTone() === 'danger'"
    >
      @if (status()) {
        @if (statusIcon(); as icon) {
          <zm-icon [name]="icon" size="sm" aria-hidden="true" />
        } @else {
          <span class="dot" aria-hidden="true"></span>
        }
        {{ status() }}
      }
    </span>
    <div class="form-actions__buttons"><ng-content /></div>`,
  styles: `
    :host {
      position: sticky;
      bottom: 0;
      z-index: var(--z-sticky);
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-3);
      padding: var(--space-4) var(--space-5);
      background: var(--color-bg-canvas);
      border-top: var(--border-width-thick) solid var(--color-border-strong);
    }

    :host(.form-actions--static) {
      position: static;
    }

    .form-actions__status {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      font: var(--text-stub);
      text-transform: uppercase;
      color: var(--color-fg-muted);
    }

    .form-actions__status--success {
      color: var(--color-success-fg);
    }

    .form-actions__status--danger {
      color: var(--color-danger-fg);
    }

    .dot {
      width: var(--space-2);
      height: var(--space-2);
      background: currentColor;
    }

    .form-actions__buttons {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-3);
      margin-inline-start: auto;
    }

    @media (forced-colors: active) {
      :host {
        border-color: CanvasText;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormActions {
  readonly placement = input<'sticky' | 'static'>('sticky');
  /** "Saved just now", "Saving…", "2 fields to fix · not saved"; empty renders no status. */
  readonly status = input('');
  readonly statusTone = input<FormActionsTone>('neutral');
  /** An icon in place of the dot. */
  readonly statusIcon = input<IconName | null>(null);
}
