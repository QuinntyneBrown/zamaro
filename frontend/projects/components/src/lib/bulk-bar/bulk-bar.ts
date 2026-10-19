import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * The bar over a selection (docs/design-system/components/calendar): an inverse strip naming how
 * many days are selected and the actions that apply to them. A labelled region whose count is a
 * polite status, so a screen reader hears the selection change. Project the actions as content;
 * `sticky` pins it to the bottom of the viewport while the page scrolls.
 */
@Component({
  selector: 'zm-bulk-bar',
  host: {
    class: 'bulk-bar',
    role: 'region',
    '[attr.aria-label]': 'label()',
    '[class.bulk-bar--sticky]': 'sticky()',
  },
  template: `<span class="bulk-bar__count" role="status">{{ count() }}</span>
    <div class="bulk-bar__actions"><ng-content /></div>`,
  styles: `
    :host {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-3);
      padding: var(--space-3) var(--space-4);
      background: var(--color-bg-inverse);
      color: var(--color-fg-inverse);
    }

    :host(.bulk-bar--sticky) {
      position: sticky;
      bottom: var(--space-4);
      z-index: var(--z-sticky);
      border: var(--border-width-thick) solid var(--color-accent);
      box-shadow: var(--shadow-2);
    }

    .bulk-bar__count {
      font: var(--text-stub);
      text-transform: uppercase;
      letter-spacing: var(--letter-spacing-wide);
    }

    .bulk-bar__actions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BulkBar {
  /** The region's name: "Selected days". */
  readonly label = input.required<string>();
  /** "2 days selected · Sat 28 – Sun 29 Nov". */
  readonly count = input.required<string>();
  readonly sticky = input(false, { transform: booleanAttribute });
}
