import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * An empty state (docs/design-system/components/empty-state): a decorative rubber stamp, a heading
 * that says what happened, one or two sentences and the ways forward. A status region, so its
 * arrival is announced. Project the body as content and buttons into `[slot=actions]`.
 */
@Component({
  selector: 'zm-empty-state',
  host: {
    class: 'empty',
    role: 'status',
    '[class.empty--quiet]': 'quiet()',
  },
  template: `@if (stamp()) {
      <p class="empty__stamp" aria-hidden="true">{{ stamp() }}</p>
    }
    <h3 class="empty__title">{{ heading() }}</h3>
    <ng-content />
    <div class="empty__actions"><ng-content select="[slot=actions]" /></div>`,
  styles: `
    :host {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: var(--space-6);
      padding: var(--space-10) var(--space-8);
      text-align: left;
      background: var(--color-bg-surface);
      border: var(--border-width-thick) dashed var(--color-border-strong);
    }

    .empty__stamp {
      width: fit-content;
      padding: var(--space-1) var(--space-3);
      border: var(--border-width-thick) solid currentColor;
      font: var(--text-h4);
      letter-spacing: var(--letter-spacing-wide);
      text-transform: uppercase;
      transform: rotate(-3deg);
    }

    .empty__title {
      font: var(--text-h2);
      text-transform: uppercase;
    }

    .empty__actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--space-2);
    }

    .empty__actions:empty {
      display: none;
    }

    :host(.empty--quiet) {
      padding: var(--space-6);
      gap: var(--space-4);
    }

    :host(.empty--quiet) .empty__title {
      font: var(--text-h4);
    }

    @media (max-width: 35.99rem) {
      :host {
        padding: var(--space-8) var(--space-5);
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyState {
  readonly heading = input.required<string>();
  /** "Sold out"; decorative and hidden from assistive technology. */
  readonly stamp = input<string>();
  /** The compact form, inside a section, a stub or a dialog. */
  readonly quiet = input(false);
}
