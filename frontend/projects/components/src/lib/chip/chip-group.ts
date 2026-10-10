import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * A labelled group of chips (docs/specs/components/chip.md, `.filters`): a fieldset whose legend
 * names the choice, with the chips projected and wrapping onto as many rows as they need
 * (L2-097.4).
 */
@Component({
  selector: 'zm-chip-group',
  template: `<fieldset class="filters">
    <legend
      [class.visually-hidden]="legendHidden()"
      [attr.id]="legendId() ?? null"
      [attr.tabindex]="legendId() ? -1 : null"
    >
      {{ legend() }}
    </legend>
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
export class ChipGroup {
  /** "Filter by style", "Or pick a city". */
  readonly legend = input.required<string>();
  /** Hides the legend visually; the group keeps its name ("Filters in use"). */
  readonly legendHidden = input(false, { transform: booleanAttribute });
  /** The legend's id, so focus can be sent to it. */
  readonly legendId = input<string>();
}
