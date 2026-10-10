import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * The paper booking ticket (docs/design-system/components/booking-form), inside the page's `<form>`
 * and labelled by `headingId`:
 * - `bar`: the Discover search, with a yellow offset shadow that stays light on the dark stage. The
 *   projected fields form a two-column grid from SM; the page spans full-width items with
 *   `grid-column: 1 / -1`.
 * - `stub`: the request form on a profile ("Book Abigail"), with the ticket number, the price and the
 *   fine print in `[slot=fine]`. It follows the page theme.
 * Only the head changes with the variant, so each slot is declared once.
 */
@Component({
  selector: 'zm-booking-form',
  host: {
    '[class.booking-bar]': "variant() === 'bar'",
    '[class.stub]': "variant() === 'stub'",
    '[attr.data-theme]': "variant() === 'bar' ? 'light' : null",
  },
  template: `@switch (variant()) {
      @case ('stub') {
        <div class="stub__head">
          <h2 class="stub__title" tabindex="-1" [id]="headingId()">{{ heading() }}</h2>
          @if (stamp()) {
            <span class="stub__code" aria-hidden="true">{{ stamp() }}</span>
          }
        </div>
        @if (price()) {
          <p>
            <span class="stub__price">{{ price() }}</span
            ><br /><span class="text-muted">{{ priceNote() }}</span>
          </p>
        }
      }
      @default {
        <h2 class="booking-bar__title" [id]="headingId()">
          {{ heading() }} <small aria-hidden="true">{{ stamp() }}</small>
        </h2>
      }
    }
    <ng-content />
    <p class="stub__fine"><ng-content select="[slot=fine]" /></p>`,
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

    :host(.stub) {
      display: flex;
      flex-direction: column;
      gap: var(--space-5);
      box-shadow: var(--shadow-3);
    }

    .stub__head {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: var(--space-2);
      padding-bottom: var(--space-3);
      border-bottom: var(--border-width-thick) dashed var(--color-border-strong);
    }

    .stub__title {
      font: var(--text-h3);
      text-transform: uppercase;
    }

    .stub__code {
      font: var(--text-stub);
      letter-spacing: var(--letter-spacing-stamp);
      text-transform: uppercase;
      white-space: nowrap;
      color: var(--color-fg-muted);
    }

    .stub__price {
      font: var(--text-figure-lg);
    }

    .text-muted {
      color: var(--color-fg-muted);
    }

    .stub__fine {
      font: var(--text-caption);
      color: var(--color-fg-muted);
    }

    .stub__fine:empty {
      display: none;
    }

    @media (min-width: 36rem) {
      :host(.booking-bar) {
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
  readonly variant = input<'bar' | 'stub'>('bar');
  /** "Your event", "Book Abigail". */
  readonly heading = input.required<string>();
  /** The heading's id; the page's `<form>` (and the stub's `<aside>`) is labelled by it. */
  readonly headingId = input.required<string>();
  /** Decoration hidden from assistive technology: "Admit one church", or "No. ACT-0027". */
  readonly stamp = input<string>();
  /** Stub only: "From $650". */
  readonly price = input<string>();
  /** Stub only: "per service · travel included". */
  readonly priceNote = input<string>();
}
