import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * A labelled group of filter chips (docs/design-system/components/chip, `.filters`): a fieldset
 * whose legend names the choice, with the chips projected and wrapping onto as many rows as they
 * need (L2-097.4).
 */
@Component({
  selector: 'zm-filter-group',
  template: `<fieldset class="filters">
    <legend>{{ legend() }}</legend>
    <ng-content />
  </fieldset>`,
  styles: `
    :host {
      display: block;
      min-width: 0;
    }

    .filters {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2);
      border: 0;
      padding: 0;
      margin: 0;
      min-width: 0;
    }

    .filters > legend {
      margin-bottom: var(--space-2);
      padding: 0;
      font: var(--text-overline);
      letter-spacing: var(--letter-spacing-stamp);
      text-transform: uppercase;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterGroup {
  /** "Filter by style". */
  readonly legend = input.required<string>();
}
