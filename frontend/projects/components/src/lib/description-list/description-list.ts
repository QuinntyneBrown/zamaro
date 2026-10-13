import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export interface DescriptionItem {
  /** A stable key. */
  id: string;
  /** "14 days or more before". */
  term: string;
  /** "Cancel free. Your deposit comes back in full." */
  value: string;
}

/**
 * Terms and their values (docs/design-system/components/description-list), in the definition
 * style: an overline term over its value, in one column or two from SM. A real `<dl>`, so each
 * term is read with its value.
 */
@Component({
  selector: 'zm-description-list',
  template: `<dl class="definition" [class.definition--two]="columns() === 2">
    @for (item of items(); track item.id) {
      <div class="definition__row">
        <dt>{{ item.term }}</dt>
        <dd>{{ item.value }}</dd>
      </div>
    }
  </dl>`,
  styles: `
    :host {
      display: block;
    }

    .definition {
      display: grid;
      gap: var(--space-4);
      margin: 0;
    }

    .definition__row {
      display: grid;
      align-content: start;
      gap: var(--space-0-5);
    }

    dt {
      font: var(--text-overline);
      letter-spacing: var(--letter-spacing-stamp);
      text-transform: uppercase;
      color: var(--color-fg-muted);
    }

    dd {
      margin: 0;
    }

    @media (min-width: 36rem) {
      .definition--two {
        grid-template-columns: 1fr 1fr;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DescriptionList {
  readonly items = input.required<readonly DescriptionItem[]>();
  /** `2` sets the rows in two columns from SM. */
  readonly columns = input<1 | 2>(1);
}
