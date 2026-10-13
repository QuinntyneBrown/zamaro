import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

/** The booking statuses of L2-029, each with its own ink. */
export type StampStatus =
  | 'requested'
  | 'accepted'
  | 'confirmed'
  | 'completed'
  | 'declined'
  | 'withdrawn'
  | 'expired'
  | 'cancelled';

/**
 * A status stamp (docs/specs/components/stamp.md): one word in a ruled, slightly turned box, such as
 * a booking's "Accepted" or an emailed link's "Expired". The host is the stamp; project the
 * translated word. With no `status` it is the ink-on-paper stamp for outcomes ("Submitted").
 */
@Component({
  selector: 'zm-stamp',
  host: { '[class]': 'classes()' },
  template: `<ng-content />`,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: var(--space-1);
      padding: var(--space-0-5) var(--space-2);
      border: var(--border-width-thick) solid currentColor;
      outline: var(--border-width-hairline) solid currentColor;
      outline-offset: var(--border-width-thick);
      font: var(--text-overline);
      letter-spacing: var(--letter-spacing-stamp);
      text-transform: uppercase;
      white-space: nowrap;
      color: var(--color-fg-default);
      background: var(--color-bg-surface);
      rotate: -2deg;
    }

    :host::before {
      content: '';
      width: 0.5em;
      height: 0.5em;
      background: currentColor;
    }

    :host(.stamp--requested) {
      color: var(--color-fg-default);
    }

    :host(.stamp--accepted) {
      color: var(--color-success-fg);
    }

    :host(.stamp--confirmed) {
      background: var(--color-accent);
      color: var(--color-fg-on-accent);
    }

    :host(.stamp--completed),
    :host(.stamp--withdrawn),
    :host(.stamp--cancelled) {
      color: var(--color-fg-muted);
    }

    :host(.stamp--cancelled) {
      text-decoration: line-through;
    }

    :host(.stamp--declined) {
      color: var(--color-danger-fg);
    }

    :host(.stamp--expired) {
      color: var(--color-warning-fg);
    }

    :host(.stamp--lg) {
      padding: var(--space-1) var(--space-3);
      font: var(--font-weight-regular) var(--font-size-2xl) / 1 var(--font-family-display);
      letter-spacing: var(--letter-spacing-wide);
      rotate: -4deg;
    }

    :host(.stamp--flat) {
      rotate: 0deg;
    }

    @media (forced-colors: active) {
      :host {
        forced-color-adjust: auto;
      }

      :host(.stamp--confirmed) {
        background: Canvas;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Stamp {
  readonly status = input<StampStatus | null>(null);
  /** `lg` once per page, in the head of one booking or an expired link's card. */
  readonly size = input<'md' | 'lg'>('md');
  /** No rotation: for table cells, receipt rows and panel heads. */
  readonly flat = input(false, { transform: booleanAttribute });

  protected readonly classes = computed(() => {
    const status = this.status();
    return [
      'stamp',
      status ? `stamp--${status}` : '',
      this.size() === 'lg' ? 'stamp--lg' : '',
      this.flat() ? 'stamp--flat' : '',
    ]
      .filter(Boolean)
      .join(' ');
  });
}
