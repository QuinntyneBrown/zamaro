import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Badge } from '../badge/badge';
import { Button } from '../button/button';
import { Skeleton } from '../skeleton/skeleton';

/** One row of a tour-dates list. */
export interface TourDate {
  /** The ISO date (`2026-11-20`); `picked` emits it. */
  id: string;
  /** The weekday over the figure: "Fri". */
  dayLabel: string;
  /** The figure: "20 Nov". */
  dayValue: string;
  /** The booker's date: `aria-current="date"` and the yellow stamp. At most one row. */
  current?: boolean;
  status?: 'free' | 'booked' | null;
  /** "Open all day", "Your date", "Sunday service, Oakville". */
  note?: string;
  /** The Pick's accessible name on a free row that is not current: "Pick Fri 20 Nov". */
  pickLabel?: string;
}

type RowKind = 'current' | 'free' | 'booked';

/**
 * Days listed like the dates on a gig poster (docs/design-system/components/tour-dates): a day
 * stamp, a note and a status. On a profile the booker's date is stamped yellow and every other free
 * day has a Pick that emits its date (L2-017). The page owns the heading, labels the list with
 * `labelledBy`, and passes new `dates` once a pick is confirmed.
 */
@Component({
  selector: 'zm-tour-dates',
  imports: [Badge, Button, Skeleton],
  template: `<ul
    class="tour-dates"
    role="list"
    [attr.aria-labelledby]="labelledBy() || null"
    [attr.aria-label]="labelledBy() ? null : label() || null"
  >
    @if (loading()) {
      @for (row of loadingRows(); track $index) {
        <li aria-hidden="true">
          <span class="tour-dates__day"
            ><zm-skeleton width="short" /><zm-skeleton shape="title" width="long"
          /></span>
          <span class="tour-dates__loading"><zm-skeleton /><zm-skeleton width="medium" /></span>
          <span></span>
        </li>
      }
      <li class="visually-hidden">{{ loadingLabel() }}</li>
    } @else {
      @for (date of dates(); track date.id; let i = $index) {
        <li [attr.aria-current]="date.current ? 'date' : null">
          <span class="tour-dates__day"
            ><small>{{ date.dayLabel }}</small
            >{{ date.dayValue }}</span
          >
          <span class="cluster">
            @if (kinds()[i] === 'free') {
              <zm-badge variant="free">{{ freeText() }}</zm-badge>
            }
            @if (date.note) {
              <span class="tour-dates__note">{{ date.note }}</span>
            }
          </span>
          @switch (kinds()[i]) {
            @case ('free') {
              <zm-button size="sm" [label]="date.pickLabel" (click)="picked.emit(date.id)">{{
                pickText()
              }}</zm-button>
            }
            @case ('booked') {
              <zm-badge variant="booked">{{ bookedText() }}</zm-badge>
            }
            @default {
              <zm-badge variant="free">{{ freeText() }}</zm-badge>
            }
          }
        </li>
      }
    }
  </ul>`,
  styles: `
    :host {
      display: block;
    }

    .tour-dates {
      list-style: none;
      padding: 0;
    }

    .tour-dates > li:not(.visually-hidden) {
      display: grid;
      grid-template-columns: 6.5rem minmax(0, 1fr) auto;
      align-items: center;
      gap: var(--space-4);
      padding-block: var(--space-4);
      border-bottom: var(--border-width-hairline) solid var(--color-border-default);
    }

    .tour-dates__day {
      font: var(--text-figure);
      line-height: var(--line-height-tight);
      text-transform: uppercase;
      white-space: nowrap;
    }

    .tour-dates__day small {
      display: block;
      font: var(--text-overline);
      letter-spacing: var(--letter-spacing-wide);
      color: var(--color-fg-muted);
    }

    li[aria-current='date'] .tour-dates__day {
      justify-self: start;
      padding: var(--space-1);
      background: var(--color-accent);
      color: var(--color-fg-on-accent);
    }

    li[aria-current='date'] .tour-dates__day small {
      color: var(--color-fg-on-accent);
    }

    .cluster {
      min-width: 0;
    }

    .tour-dates__note {
      font: var(--text-body-sm);
      color: var(--color-fg-muted);
    }

    .tour-dates__day:has(zm-skeleton),
    .tour-dates__loading {
      display: grid;
      gap: var(--space-2);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TourDates {
  readonly dates = input.required<readonly TourDate[]>();
  /** The id of the heading that names the list. */
  readonly labelledBy = input<string>();
  /** The list's name when there is no heading; ignored with `labelledBy`. */
  readonly label = input<string>();
  readonly freeText = input('');
  readonly bookedText = input('');
  readonly pickText = input('');
  /** Skeleton rows, with `loadingLabel` as visually hidden text. */
  readonly loading = input(false);
  readonly loadingCount = input(4);
  readonly loadingLabel = input('');

  readonly picked = output<string>();

  /** Each row as current, free (with Pick) or booked. */
  protected readonly kinds = computed(() =>
    this.dates().map((date): RowKind =>
      date.status === 'booked' ? 'booked' : date.current ? 'current' : 'free',
    ),
  );

  protected readonly loadingRows = computed(() => Array.from({ length: this.loadingCount() }));
}
