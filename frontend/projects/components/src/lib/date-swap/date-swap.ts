import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export interface DateSwapOption {
  /** The ISO date the button picks: "2026-12-23". */
  readonly value: string;
  /** The short date: "Wed 23 Dec". */
  readonly date: string;
  /** The count or note: "1 choir free". */
  readonly detail: string;
}

let nextId = 0;

/**
 * Nearby dates offered instead (docs/specs/components/empty-state.md, `.date-swap`): an optional
 * heading over a grid of date buttons that lift and fill yellow on hover. With no heading, `label`
 * names the list.
 */
@Component({
  selector: 'zm-date-swap',
  template: `@if (heading()) {
      @switch (headingLevel()) {
        @case (3) {
          <h3 [id]="headingId">{{ heading() }}</h3>
        }
        @case (5) {
          <h5 [id]="headingId">{{ heading() }}</h5>
        }
        @default {
          <h4 [id]="headingId">{{ heading() }}</h4>
        }
      }
    }
    <ul
      class="date-swap"
      role="list"
      [attr.aria-labelledby]="heading() ? headingId : null"
      [attr.aria-label]="heading() ? null : (label() ?? null)"
    >
      @for (option of dates(); track option.value) {
        <li>
          <button type="button" (click)="datePicked.emit(option.value)">
            <strong>{{ option.date }}</strong> {{ option.detail }}
          </button>
        </li>
      }
    </ul>`,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    .date-swap {
      display: grid;
      gap: var(--space-3);
      grid-template-columns: repeat(auto-fill, minmax(9rem, 1fr));
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .date-swap button {
      width: 100%;
      display: grid;
      gap: var(--space-1);
      padding: var(--space-3);
      text-align: left;
      cursor: pointer;
      background: var(--color-bg-surface);
      color: var(--color-fg-default);
      border: var(--border-width-thick) solid var(--color-border-strong);
      font: var(--text-body-sm);
      transition:
        transform var(--duration-fast) var(--ease-standard),
        box-shadow var(--duration-fast) var(--ease-standard);
    }

    .date-swap button:hover {
      background: var(--color-accent);
      color: var(--color-fg-on-accent);
      border-color: var(--color-border-on-accent);
      box-shadow: var(--shadow-1);
      transform: var(--transform-lift);
    }

    .date-swap strong {
      font: var(--text-figure);
      text-transform: uppercase;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DateSwap {
  readonly dates = input.required<readonly DateSwapOption[]>();
  /** "Nearby dates with choirs free". */
  readonly heading = input<string>();
  readonly headingLevel = input<3 | 4 | 5>(4);
  /** Names the list when there is no visible heading. */
  readonly label = input<string>();
  /** Emits the ISO `value` of the date picked. */
  readonly datePicked = output<string>();

  protected readonly headingId = `zm-date-swap-heading-${nextId++}`;
}
