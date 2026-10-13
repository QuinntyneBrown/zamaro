import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * A status stamp (docs/design-system/components/badge). `free` is the yellow availability stamp;
 * `booked` is muted and struck through; `success`, `info`, `warning` and `danger` carry an outcome
 * ("Succeeded", "Scheduled", "Held", "Failed"); `count` is the number after a navigation label.
 */
@Component({
  selector: 'zm-badge',
  template: `<span
    class="badge"
    [class.badge--free]="variant() === 'free'"
    [class.badge--booked]="variant() === 'booked'"
    [class.badge--success]="variant() === 'success'"
    [class.badge--info]="variant() === 'info'"
    [class.badge--warning]="variant() === 'warning'"
    [class.badge--danger]="variant() === 'danger'"
    [class.badge--count]="variant() === 'count'"
    ><ng-content
  /></span>`,
  styles: `
    .badge {
      --badge-fg: currentColor;
      --badge-bg: transparent;
      --badge-border: currentColor;
      display: inline-flex;
      align-items: center;
      gap: var(--space-1);
      padding: var(--space-0-5) var(--space-2);
      font: var(--text-overline);
      letter-spacing: var(--letter-spacing-wide);
      text-transform: uppercase;
      white-space: nowrap;
      color: var(--badge-fg);
      background: var(--badge-bg);
      border: var(--border-width-hairline) solid var(--badge-border);
      border-radius: var(--radius-sm);
    }

    .badge::before {
      content: '';
      width: 0.5em;
      height: 0.5em;
      background: currentColor;
      flex: none;
    }

    .badge--free {
      --badge-bg: var(--color-accent);
      --badge-fg: var(--color-fg-on-accent);
      --badge-border: var(--color-border-on-accent);
    }

    .badge--count {
      --badge-bg: var(--color-accent);
      --badge-fg: var(--color-fg-on-accent);
      --badge-border: var(--color-border-on-accent);
      padding: 0 var(--space-1);
      min-width: 1.5em;
      justify-content: center;
    }

    .badge--count::before {
      display: none;
    }

    .badge--success {
      --badge-bg: var(--color-success-bg);
      --badge-fg: var(--color-success-fg);
      --badge-border: var(--color-success-border);
    }

    .badge--info {
      --badge-bg: var(--color-info-bg);
      --badge-fg: var(--color-info-fg);
      --badge-border: var(--color-info-border);
    }

    .badge--warning {
      --badge-bg: var(--color-warning-bg);
      --badge-fg: var(--color-warning-fg);
      --badge-border: var(--color-warning-icon);
    }

    .badge--danger {
      --badge-bg: var(--color-danger-bg);
      --badge-fg: var(--color-danger-fg);
      --badge-border: var(--color-danger-border);
    }

    .badge--booked {
      --badge-fg: var(--color-fg-muted);
      text-decoration: line-through;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Badge {
  readonly variant = input<
    'default' | 'free' | 'booked' | 'success' | 'info' | 'warning' | 'danger' | 'count'
  >('default');
}
