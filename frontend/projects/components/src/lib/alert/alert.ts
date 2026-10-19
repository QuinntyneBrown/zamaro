import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Icon } from '../icon/icon';

/**
 * An inline alert (docs/design-system/components/alert). A danger alert is `role="alert"` and is
 * never dismissible while the problem lasts; a success alert is `role="status"`, read politely. Project the message as content and the buttons into
 * `[slot=actions]`; wrap each slotted node in its own `@if` (NG8011).
 */
@Component({
  selector: 'zm-alert',
  imports: [Icon],
  template: `<div
    class="alert"
    [class.alert--danger]="variant() === 'danger'"
    [class.alert--success]="variant() === 'success'"
    [class.alert--warning]="variant() === 'warning'"
    [class.alert--compact]="compact()"
    [attr.role]="variant() === 'success' ? 'status' : 'alert'"
  >
    <zm-icon
      [name]="
        variant() === 'danger' || variant() === 'warning'
          ? 'warning'
          : variant() === 'success'
            ? 'check'
            : 'info'
      "
      [size]="compact() ? 'md' : 'lg'"
    />
    <div class="stack stack--sm">
      <p class="alert__title">{{ heading() }}</p>
      <ng-content />
    </div>
    <div class="alert__actions"><ng-content select="[slot=actions]" /></div>
  </div>`,
  styles: `
    .alert {
      --alert-bg: var(--color-info-bg);
      --alert-border: var(--color-info-border);
      --alert-icon: var(--color-info-icon);
      display: grid;
      grid-template-columns: auto minmax(0, 1fr);
      gap: var(--space-4) var(--space-5);
      align-items: start;
      padding: var(--space-6);
      border: var(--border-width-thick) solid var(--alert-border);
      background: var(--alert-bg);
      color: var(--color-fg-default);
    }

    .alert--danger {
      --alert-bg: var(--color-danger-bg);
      --alert-border: var(--color-danger-border);
      --alert-icon: var(--color-danger-icon);
    }

    .alert--warning {
      --alert-bg: var(--color-warning-bg);
      --alert-border: var(--color-warning-icon);
      --alert-icon: var(--color-warning-icon);
    }

    .alert--success {
      --alert-bg: var(--color-success-bg);
      --alert-border: var(--color-success-border);
      --alert-icon: var(--color-success-icon);
    }

    .alert--compact {
      gap: var(--space-2) var(--space-3);
      padding: var(--space-4);
    }

    .alert--compact .alert__title {
      font: var(--text-h4);
    }

    .alert > zm-icon {
      color: var(--alert-icon);
    }

    .alert__title {
      font: var(--text-h3);
      text-transform: uppercase;
      color: var(--color-fg-default);
    }

    .alert__actions {
      grid-column: 1 / -1;
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-3);
    }

    .alert__actions:empty {
      display: none;
    }

    @media (min-width: 36rem) {
      .alert__actions {
        grid-column: 2;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Alert {
  readonly heading = input.required<string>();
  /** A warning (the calendar's "a church has asked about this date") is `role="alert"` like danger. */
  readonly variant = input<'info' | 'success' | 'warning' | 'danger'>('info');
  /** Tighter padding and a smaller title: inside auth cards, dialogs, forms and cards. */
  readonly compact = input(false, { transform: booleanAttribute });
}
