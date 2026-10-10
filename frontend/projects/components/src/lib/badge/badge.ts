import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** A status stamp (docs/design-system/components/badge). `free` is the yellow availability stamp. */
@Component({
  selector: 'zm-badge',
  template: `<span class="badge" [class.badge--free]="variant() === 'free'"><ng-content /></span>`,
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
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Badge {
  readonly variant = input<'default' | 'free'>('default');
}
