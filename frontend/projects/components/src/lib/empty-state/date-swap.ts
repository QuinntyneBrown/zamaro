import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export interface DateSwapOption {
  /** The ISO date the button picks. */
  readonly date: string;
  /** "Sun 27 Dec". */
  readonly label: string;
  /** "3 choirs free". */
  readonly count: string;
}

/**
 * The nearby dates an empty state offers instead (docs/design-system/components/empty-state,
 * `.date-swap`): a heading and a grid of date buttons that lift and fill yellow on hover.
 */
@Component({
  selector: 'zm-date-swap',
  template: `<h4>{{ heading() }}</h4>
    <ul class="date-swap" role="list">
      @for (option of options(); track option.date) {
        <li>
          <button type="button" (click)="pick.emit(option.date)">
            <strong>{{ option.label }}</strong> {{ option.count }}
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
  /** "Nearby dates with choirs free". */
  readonly heading = input.required<string>();
  readonly options = input.required<readonly DateSwapOption[]>();
  /** Emits the ISO date of the button pressed. */
  readonly pick = output<string>();
}
