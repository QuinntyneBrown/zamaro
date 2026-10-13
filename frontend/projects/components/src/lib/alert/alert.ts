import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { Icon, type IconName } from '../icon/icon';

/**
 * An inline alert (docs/specs/components/alert): info, success, warning or danger, each with its icon.
 * A danger alert is `role="alert"` and is never dismissible while the problem lasts; success and
 * warning are `role="status"`. Project the message as content and the buttons into `[slot=actions]`;
 * wrap each slotted node in its own `@if` (NG8011).
 */
@Component({
  selector: 'zm-alert',
  imports: [Icon],
  template: `<div
    class="alert"
    [class.alert--success]="variant() === 'success'"
    [class.alert--warning]="variant() === 'warning'"
    [class.alert--danger]="variant() === 'danger'"
    [class.alert--compact]="compact()"
    [attr.role]="role()"
  >
    <zm-icon [name]="iconName()" [size]="compact() ? 'md' : 'lg'" />
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

    .alert--success {
      --alert-bg: var(--color-success-bg);
      --alert-border: var(--color-success-border);
      --alert-icon: var(--color-success-icon);
    }

    .alert--warning {
      --alert-bg: var(--color-warning-bg);
      --alert-border: var(--color-warning-border);
      --alert-icon: var(--color-warning-icon);
    }

    .alert--danger {
      --alert-bg: var(--color-danger-bg);
      --alert-border: var(--color-danger-border);
      --alert-icon: var(--color-danger-icon);
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
  readonly variant = input<'info' | 'success' | 'warning' | 'danger'>('info');
  /** Tighter padding and a smaller title: inside auth cards, dialogs, forms and cards. */
  readonly compact = input(false, { transform: booleanAttribute });
  /** A more exact picture than the variant's icon: 'pause' for a held booking, 'lock' for a locked sign-in. */
  readonly icon = input<IconName | null>(null);
  /**
   * The live role: danger and info announce as `alert` (info keeps the role the M2 pages were built
   * with), success and warning as `status`; `off` for an alert that is part of the page when it loads.
   */
  readonly live = input<'alert' | 'status' | 'off' | null>(null);

  protected readonly iconName = computed<IconName>(() => {
    const icon = this.icon();
    if (icon) return icon;
    switch (this.variant()) {
      case 'success':
        return 'check';
      case 'warning':
      case 'danger':
        return 'warning';
      default:
        return 'info';
    }
  });

  protected readonly role = computed(() => {
    const live = this.live();
    if (live === 'off') return null;
    if (live) return live;
    return this.variant() === 'success' || this.variant() === 'warning' ? 'status' : 'alert';
  });
}
