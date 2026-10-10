import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * The paper booking ticket (docs/design-system/components/booking-form), inside the page's `<form>`
 * and labelled by `headingId`:
 * - `bar`: the Discover search, with a yellow offset shadow that stays light on the dark stage. The
 *   projected fields form a two-column grid from SM; the page spans full-width items with
 *   `grid-column: 1 / -1`.
 * - `stub`: the request form on a profile ("Book Abigail"), with the ticket number, the price and the
 *   fine print in `[slot=fine]`. It follows the page theme.
 * - `auth`: the "Admit one" card on the sign-in and account pages: the stamp over the page's `h1`,
 *   then the body, the links in `[slot=links]` and the fine print.
 * Only the head changes with the variant, so each slot is declared once.
 */
@Component({
  selector: 'zm-booking-form',
  host: {
    '[class.booking-bar]': "variant() === 'bar'",
    '[class.stub]': "variant() !== 'bar'",
    '[class.auth-card]': "variant() === 'auth'",
    '[attr.data-theme]': "variant() === 'bar' ? 'light' : null",
    '[attr.aria-busy]': "busy() ? 'true' : null",
    '[attr.role]': "landmark() ? 'region' : null",
    '[attr.aria-labelledby]': 'landmark() ? headingId() : null',
  },
  template: `@switch (variant()) {
      @case ('auth') {
        <div class="stub__head">
          @if (stamp()) {
            <span class="stub__code" aria-hidden="true">{{ stamp() }}</span>
          }
          @switch (headingLevel()) {
            @case (1) {
              <h1 class="auth-card__title" tabindex="-1" [id]="headingId()">{{ heading() }}</h1>
            }
            @default {
              <h2 class="auth-card__title" tabindex="-1" [id]="headingId()">{{ heading() }}</h2>
            }
          }
        </div>
      }
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
    <div class="auth-card__links"><ng-content select="[slot=links]" /></div>
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

    .stub__fine:empty,
    .auth-card__links:empty,
    :host(:not(.auth-card)) .auth-card__links {
      display: none;
    }

    :host(.auth-card) {
      position: relative;
      z-index: var(--z-raised);
      width: 100%;
      max-width: var(--layout-auth-width);
      box-shadow: var(--size-offset-3) var(--size-offset-3) 0 var(--color-accent-on-stage);
    }

    :host(.auth-card) .stub__head {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--space-1);
    }

    .auth-card__title {
      font: var(--text-h2);
      text-transform: uppercase;
    }

    .auth-card__links {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: var(--space-3);
      font: var(--text-body-sm);
    }

    /* While the page's request is pending, the projected fields fade and ignore the pointer; their
       values stay. Projected content carries the page's style scope, hence ::ng-deep under :host. */
    :host([aria-busy='true']) ::ng-deep .field {
      opacity: 0.6;
      pointer-events: none;
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
  readonly variant = input<'bar' | 'stub' | 'auth'>('bar');
  /** "Your event", "Book Abigail", "Sign in". */
  readonly heading = input.required<string>();
  /** Auth only: 1 when the card holds the page's heading. */
  readonly headingLevel = input<1 | 2>(2);
  /** The page's request is pending: `aria-busy`, and the fields fade (the submit shows its own busy state). */
  readonly busy = input(false, { transform: booleanAttribute });
  /** A card outside any `<form>` (a status or an expired link): a region named by the heading. */
  readonly landmark = input(false, { transform: booleanAttribute });
  /** The heading's id; the page's `<form>` (and the stub's `<aside>`) is labelled by it. */
  readonly headingId = input.required<string>();
  /** Decoration hidden from assistive technology: "Admit one church", "No. ACT-0027" or "Admit one · Your account". */
  readonly stamp = input<string>();
  /** Stub only: "From $650". */
  readonly price = input<string>();
  /** Stub only: "per service · travel included". */
  readonly priceNote = input<string>();
}
