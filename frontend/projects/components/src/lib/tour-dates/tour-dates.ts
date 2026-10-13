import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  Directive,
  inject,
  input,
  output,
  TemplateRef,
} from '@angular/core';
import { RouterLink } from '@angular/router';
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
  /** Schedule only: the bold first line, "Harvest Point Church" or "ZAM-0097 · Riverside Community Church". */
  title?: string;
  /** Schedule only: makes the title a route link. */
  titleLink?: string | unknown[];
}

type RowKind = 'current' | 'free' | 'booked';

/**
 * The trail of a schedule row, rendered once per date with the row as `$implicit`: a `zm-stamp`,
 * a `zm-badge` or a small button. Ignored by the public variant.
 *
 * `<ng-template zmTourDateTrail let-row><zm-stamp [status]="row.status">…</zm-stamp></ng-template>`
 */
@Directive({ selector: 'ng-template[zmTourDateTrail]' })
export class TourDateTrail {
  readonly template = inject<TemplateRef<{ $implicit: TourDate }>>(TemplateRef);
}

/**
 * Days listed like the dates on a gig poster (docs/specs/components/tour-dates): a day stamp, a
 * note and a status. On a profile (`public`) the booker's date is stamped yellow and every other
 * free day has a Pick that emits its date (L2-017). A private `schedule` (the artist's dashboard,
 * the admin's "Upcoming bookings") names the church in bold over the note and lets the page put a
 * stamp, badge or button in the trail with `zmTourDateTrail`. The page owns the heading, labels the
 * list with `labelledBy`, and passes new `dates` once a pick is confirmed.
 */
@Component({
  selector: 'zm-tour-dates',
  imports: [Badge, Button, NgTemplateOutlet, RouterLink, Skeleton],
  template: `<ul
    class="tour-dates"
    role="list"
    [class.tour-dates--schedule]="variant() === 'schedule'"
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
          @if (variant() === 'schedule') {
            <span class="tour-dates__body"
              ><strong>
                @if (date.titleLink) {
                  <a [routerLink]="date.titleLink">{{ date.title }}</a>
                } @else {
                  {{ date.title }}
                }
              </strong>
              @if (date.note) {
                <br /><span class="tour-dates__note">{{ date.note }}</span>
              }
            </span>
            <span class="tour-dates__trail">
              @if (trail(); as trail) {
                <ng-container
                  [ngTemplateOutlet]="trail.template"
                  [ngTemplateOutletContext]="{ $implicit: date }"
                />
              }
            </span>
          } @else {
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

    /* Schedule rows: the church in bold over the note; the trail holds what the page puts there. */
    .tour-dates__body {
      min-width: 0;
    }

    .tour-dates__body strong {
      font: var(--text-label);
    }

    .tour-dates__body a {
      color: inherit;
    }

    .tour-dates__trail {
      display: flex;
      align-items: center;
      justify-content: end;
    }

    /* Below SM a schedule row puts its trail under the body, aligned to the body's start. */
    @media (max-width: 35.99rem) {
      .tour-dates--schedule > li:not(.visually-hidden):not([aria-hidden]) {
        grid-template-columns: 6.5rem minmax(0, 1fr);
        grid-template-areas:
          'day body'
          'day trail';
        row-gap: 0;
      }

      .tour-dates--schedule .tour-dates__day {
        grid-area: day;
      }

      .tour-dates--schedule .tour-dates__body {
        grid-area: body;
      }

      .tour-dates--schedule .tour-dates__trail {
        grid-area: trail;
        justify-content: start;
      }

      .tour-dates--schedule .tour-dates__trail:not(:empty) {
        margin-top: var(--space-2);
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TourDates {
  readonly dates = input.required<readonly TourDate[]>();
  /** Public: the Free and Booked badges and Pick. Schedule: a title and note, with the trail template. */
  readonly variant = input<'public' | 'schedule'>('public');
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

  /** The schedule trail, when the page gives one. */
  protected readonly trail = contentChild(TourDateTrail);

  /** Each row as current, free (with Pick) or booked. */
  protected readonly kinds = computed(() =>
    this.dates().map((date): RowKind =>
      date.status === 'booked' ? 'booked' : date.current ? 'current' : 'free',
    ),
  );

  protected readonly loadingRows = computed(() => Array.from({ length: this.loadingCount() }));
}
