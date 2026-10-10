import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * The paper booking bar (docs/design-system/components/booking-form): a ticket with a yellow offset
 * shadow that stays light on the dark stage. Place it inside the page's `<form>`, labelled by
 * `titleId`; the projected fields form a two-column grid from SM. The page spans its own full-width
 * items (submit, error summary, chips) with `grid-column: 1 / -1`.
 */
@Component({
  selector: 'zm-booking-form',
  host: { 'data-theme': 'light' },
  template: `<h2 class="booking-bar__title" [id]="titleId()">
      {{ heading() }} <small aria-hidden="true">{{ stamp() }}</small>
    </h2>
    <ng-content />`,
  styles: `
    :host {
      display: grid;
      gap: var(--space-4);
      padding: var(--space-6);
      background: var(--color-bg-surface);
      color: var(--color-fg-default);
      border: var(--border-width-thick) solid var(--color-border-strong);
      box-shadow: var(--size-offset-3) var(--size-offset-3) 0 var(--color-accent-on-stage);
    }

    .booking-bar__title {
      display: flex;
      justify-content: space-between;
      gap: var(--space-2);
      padding-bottom: var(--space-3);
      font: var(--text-h4);
      text-transform: uppercase;
      border-bottom: var(--border-width-thick) dashed var(--color-border-strong);
    }

    .booking-bar__title small {
      font: var(--text-stub);
    }

    @media (min-width: 36rem) {
      :host {
        grid-template-columns: 1fr 1fr;
      }

      .booking-bar__title {
        grid-column: 1 / -1;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingForm {
  /** "Your event". */
  readonly heading = input.required<string>();
  /** The decorative stamp, hidden from assistive technology: "Admit one church". */
  readonly stamp = input.required<string>();
  readonly titleId = input.required<string>();
}
