import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Icon } from '../icon/icon';

/**
 * An inline alert (docs/design-system/components/alert). A danger alert is `role="alert"` and is
 * never dismissible while the problem lasts. Project the message as content and the buttons into
 * `[slot=actions]`; wrap each slotted node in its own `@if` (NG8011).
 */
@Component({
  selector: 'zm-alert',
  imports: [Icon],
  template: `<div class="alert" [class.alert--danger]="variant() === 'danger'" role="alert">
    <span class="alert__icon"
      ><zm-icon [name]="variant() === 'danger' ? 'warning' : 'info'" size="lg"
    /></span>
    <div class="alert__body">
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

    .alert__icon {
      display: inline-flex;
      color: var(--alert-icon);
    }

    .alert__body {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
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
  readonly variant = input<'info' | 'danger'>('info');
}
