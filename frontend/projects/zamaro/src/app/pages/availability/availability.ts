import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  Injector,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import {
  type AffectedRequest,
  type ArtistCalendarDay,
  type CalendarDate,
  type DateRange,
  FormatService,
  type GatheringKind,
  isRangeWarning,
  type RangeResult,
  torontoToday,
} from 'api';
import {
  Alert,
  Badge,
  BulkBar,
  Button,
  ButtonLink,
  Calendar,
  type CalendarGridDay,
  type CalendarLegendItem,
  type CalendarPageTurn,
  type CalendarWeekday,
  EmptyState,
  Icon,
  Skeleton,
  Stamp,
  ToastService,
  type TourDate,
  TourDates,
  TourDateTrail,
} from 'components';
import { openBlockDatesDialog } from '../../dialogs/block-dates/block-dates';
import { openWeeklyDefaultDialog } from '../../dialogs/weekly-default/weekly-default';
import { dayList, dayRange, shortDay } from '../../shared/day-list';
import { PageMeta } from '../../shared/page-meta';
import { AvailabilityStore, type UnavailableRun } from './availability.store';

const WEEKDAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

interface ScheduleRow extends TourDate {
  stamp: 'confirmed' | 'requested' | null;
}

/**
 * The artist's availability at `/artist/calendar` (docs/mocks/pages/availability, L2-056, L2-057):
 * one month of Free, Unavailable, Requested and Booked days, the weekly default, the "In {month}"
 * list and, over a selection, the bulk bar. The month is in the address (`?month=2026-11`), so the
 * pager is a navigation and Back returns to the month before.
 */
@Component({
  selector: 'zm-availability-page',
  imports: [
    Alert,
    Badge,
    BulkBar,
    Button,
    ButtonLink,
    Calendar,
    EmptyState,
    Icon,
    Skeleton,
    Stamp,
    TourDates,
    TourDateTrail,
    TranslocoPipe,
  ],
  providers: [AvailabilityStore],
  templateUrl: './availability.html',
  styleUrl: './availability.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvailabilityPage {
  protected readonly store = inject(AvailabilityStore);
  private readonly format = inject(FormatService);
  private readonly transloco = inject(TranslocoService);
  private readonly toasts = inject(ToastService);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);
  /** A bulk-bar save in flight: the bar's buttons wait for it. */
  protected readonly saving = signal(false);

  protected readonly today: CalendarDate = torontoToday();
  protected readonly weekdays: CalendarWeekday[] = WEEKDAY_KEYS.map((key) => ({
    short: this.t(`weekday.${key}.short`),
    long: this.t(`weekday.${key}.long`),
  }));
  protected readonly legend: CalendarLegendItem[] = [
    { status: 'free', label: this.t('legend.free') },
    { status: 'requested', label: this.t('legend.requested') },
    { status: 'booked', label: this.t('legend.booked') },
    { status: 'blocked', label: this.t('legend.unavailable') },
  ];

  /** The month on show, `YYYY-MM`: the calendar's once it arrives, else the one asked for. */
  protected readonly month = computed(
    () => this.store.calendar()?.month ?? this.store.month() ?? this.today.slice(0, 7),
  );
  protected readonly monthTitle = computed(() => this.format.monthYear(this.month()));
  protected readonly monthName = computed(() => this.monthNameOf(this.month()));

  protected readonly subtitle = computed(() => {
    if (this.store.status() !== 'loaded') return this.monthTitle();
    if (this.store.untouched()) return this.t('subtitle.empty', { month: this.monthTitle() });
    return this.t('subtitle.summary', {
      month: this.monthTitle(),
      booked: this.store.booked(),
      requested: this.store.requested(),
      saturdays: this.store.freeSaturdays(),
    });
  });

  /** "Unavailable every Monday", or "none". */
  protected readonly weeklyDefault = computed(() => {
    const weekdays = this.store.unavailableWeekdays();
    if (weekdays.length === 0) return this.t('weekly.none');
    const names = weekdays.map((weekday) => this.t(`weekday.${WEEKDAY_KEYS[weekday % 7]}.long`));
    return this.t('weekly.value', { days: this.list(names) });
  });

  protected readonly previousLabel = computed(() => {
    const month = this.store.adjacentMonth('previous') ?? this.month();
    return this.t('calendar.previous', { month: this.format.monthYear(month) });
  });
  protected readonly nextLabel = computed(() => {
    const month = this.store.adjacentMonth('next') ?? this.month();
    return this.t('calendar.next', { month: this.format.monthYear(month) });
  });
  protected readonly caption = computed(() => {
    const until = this.store.window()?.until;
    return until ? this.t('caption', { date: this.format.shortDateWithYear(until) }) : '';
  });

  protected readonly gridDays = computed<CalendarGridDay[]>(() =>
    this.store.days().map((day) => this.gridDay(day)),
  );

  /** The "In {month}" rows: booked and requested dates, and the runs of chosen Unavailable dates. */
  protected readonly rows = computed<ScheduleRow[]>(() => {
    const rows: ScheduleRow[] = [];
    for (const day of this.store.days()) {
      if (day.status === 'booked' || day.status === 'requested') rows.push(this.scheduleRow(day));
    }
    for (const run of this.store.unavailableRuns()) rows.push(this.unavailableRow(run));
    return rows.sort((a, b) => a.id.localeCompare(b.id));
  });

  /** "2 days selected · Sat 28 – Sun 29 Nov". */
  protected readonly selectionCount = computed(() => {
    const selected = this.store.selected();
    if (selected.length === 0) return '';
    const first = selected[0];
    const last = selected[selected.length - 1];
    const range =
      first === last
        ? this.format.shortDate(first)
        : this.t('bulk.range', {
            from: shortDay(first, this.format),
            to: this.format.shortDate(last),
          });
    return this.t('bulk.count', { count: selected.length, range });
  });

  /** The selection holds an Unavailable day, so the bar offers Mark free (docs/mocks/pages/availability/selected). */
  protected readonly selectionHasUnavailable = computed(() => {
    const selected = new Set(this.store.selected());
    return this.store.days().some((day) => selected.has(day.date) && day.status === 'unavailable');
  });

  constructor() {
    inject(PageMeta).set({ title: this.t('pageTitle'), index: false });
    inject(ActivatedRoute)
      .queryParamMap.pipe(takeUntilDestroyed())
      .subscribe((params) => {
        const month = params.get('month');
        this.store.load(month && /^\d{4}-\d{2}$/.test(month) ? month : null);
      });
  }

  protected retry(): void {
    this.store.load(this.store.month());
  }

  protected turnPage(turn: CalendarPageTurn): void {
    const month = this.store.adjacentMonth(turn.direction);
    if (!month) return;
    void this.router.navigate([], { queryParams: { month }, queryParamsHandling: 'merge' });
  }

  protected select(dates: string[]): void {
    this.store.select(dates);
  }

  protected clearSelection(): void {
    this.store.clearSelection();
  }

  /** "Mark dates unavailable": the dialog, then the toasts for what it changed. */
  protected openBlockDates(from?: string, to?: string, warning?: AffectedRequest[]): void {
    const window = this.store.window();
    openBlockDatesDialog(this.injector, {
      month: this.month(),
      days: this.store.days(),
      earliest: this.today,
      latest: window?.until ?? this.today,
      from,
      to,
      warning,
    }).closed.subscribe((result) => {
      if (!result) return;
      this.store.reload();
      this.announce(result.range, result);
    });
  }

  /** "Change weekly default" / "Set a weekly default". */
  protected openWeeklyDefault(): void {
    openWeeklyDefaultDialog(this.injector, {
      unavailableWeekdays: this.store.unavailableWeekdays(),
      current: this.weeklyDefault(),
    }).closed.subscribe((saved) => {
      if (saved) this.store.weeklyDefaultSaved(saved);
    });
  }

  /** The bulk bar's Mark unavailable or Mark free: each run of selected days saved as one range. */
  protected saveSelection(): void {
    if (this.saving()) return;
    const state = this.selectionHasUnavailable() ? 'free' : 'unavailable';
    const runs = this.store.selectedRuns();
    this.saving.set(true);
    const next = (index: number): void => {
      const run = runs[index];
      if (!run) {
        this.saving.set(false);
        return;
      }
      const range: DateRange = { from: run.from, to: run.to, state };
      this.store.saveRange(range).subscribe({
        next: (result) => {
          if (isRangeWarning(result)) {
            this.saving.set(false);
            this.openBlockDates(run.from, run.to, result.affectedRequests);
            return;
          }
          this.announce(range, result);
          next(index + 1);
        },
        error: () => {
          this.saving.set(false);
          this.failed(range);
        },
      });
    };
    next(0);
  }

  /** The toasts for a saved range: Saved with Undo, and Heads up for Booked days that stayed. */
  private announce(range: DateRange, result: RangeResult): void {
    const changed = result.changedDates;
    if (changed.length) {
      const first = changed[0];
      const last = changed[changed.length - 1];
      const unavailable = range.state === 'unavailable';
      const title = this.t(unavailable ? 'toast.saved.unavailableTitle' : 'toast.saved.freeTitle', {
        range: dayRange(first, last, this.format),
      });
      this.toasts.show({
        variant: 'success',
        kind: this.t('toast.saved.kind'),
        title,
        text: this.t(unavailable ? 'toast.saved.unavailableText' : 'toast.saved.freeText', {
          days: dayList(changed, 'or', this.format),
        }),
        actions: [
          {
            label: this.t('toast.saved.undo'),
            ariaLabel: this.t('toast.saved.undoLabel', { title }),
            run: () => this.undo(range, changed),
          },
        ],
        dismissLabel: this.transloco.translate('common.toast.dismiss', { title }),
        key: `range-${first}`,
      });
    }
    if (result.skippedDates.length) {
      const skipped = result.skippedDates;
      const church =
        skipped.length === 1
          ? (this.store.days().find((day) => day.date === skipped[0])?.church ?? 'none')
          : 'none';
      const title = this.t('toast.booked.stillTitle', {
        days: dayList(skipped, 'and', this.format),
        count: skipped.length,
      });
      this.toasts.show({
        variant: 'warning',
        kind: this.t('toast.booked.stillKind'),
        title,
        text: this.t('toast.booked.stillText', {
          changed: dayList(changed, 'and', this.format),
          changedCount: changed.length,
          skipped: dayList(skipped, 'and', this.format),
          count: skipped.length,
          church,
        }),
        dismissLabel: this.transloco.translate('common.toast.dismiss', { title }),
        key: `skipped-${skipped[0]}`,
      });
    }
  }

  /** Undo: the same days back the other way, then its own Saved toast without an Undo. */
  private undo(range: DateRange, dates: CalendarDate[]): Promise<unknown> {
    const reverse: DateRange = {
      from: dates[0],
      to: dates[dates.length - 1],
      state: range.state === 'unavailable' ? 'free' : 'unavailable',
    };
    return new Promise((resolve, reject) => {
      this.store.saveRange(reverse).subscribe({
        next: (result) => {
          if (!isRangeWarning(result)) this.announceUndo(reverse, result);
          resolve(result);
        },
        error: (error: unknown) => {
          this.failed(reverse);
          reject(error instanceof Error ? error : new Error('The undo did not reach the server.'));
        },
      });
    });
  }

  private announceUndo(range: DateRange, result: RangeResult): void {
    const changed = result.changedDates;
    if (!changed.length) return;
    const free = range.state === 'free';
    const title = this.t(free ? 'toast.saved.freeTitle' : 'toast.saved.unavailableTitle', {
      range: dayRange(changed[0], changed[changed.length - 1], this.format),
    });
    this.toasts.show({
      variant: 'success',
      kind: this.t('toast.saved.kind'),
      title,
      text: this.t(free ? 'toast.saved.freeText' : 'toast.saved.unavailableText', {
        days: dayList(changed, 'or', this.format),
      }),
      dismissLabel: this.transloco.translate('common.toast.dismiss', { title }),
      key: `range-${changed[0]}`,
    });
  }

  /** A save that never reached the server: nothing changed, and Try again sends it again. */
  private failed(range: DateRange): void {
    const title = this.t('toast.failed.title');
    this.toasts.show({
      variant: 'danger',
      kind: this.t('toast.failed.kind'),
      title,
      text: this.t(range.state === 'unavailable' ? 'toast.failed.text' : 'toast.failed.freeText', {
        days: dayList(this.datesIn(range), 'and', this.format),
      }),
      actions: [
        {
          label: this.t('toast.failed.tryAgain'),
          run: () =>
            new Promise((resolve, reject) => {
              this.store.saveRange(range).subscribe({
                next: (result) => {
                  if (!isRangeWarning(result)) this.announce(range, result);
                  resolve(result);
                },
                error: (error: unknown) =>
                  reject(
                    error instanceof Error
                      ? error
                      : new Error('The save did not reach the server.'),
                  ),
              });
            }),
        },
      ],
      dismissLabel: this.transloco.translate('common.toast.dismiss', { title }),
      key: `failed-${range.from}`,
    });
  }

  private datesIn(range: DateRange): CalendarDate[] {
    const dates: CalendarDate[] = [];
    for (let date = range.from; date <= range.to && dates.length < 600; date = addDay(date)) {
      dates.push(date);
    }
    return dates;
  }

  /** A Booked day cannot change here; a Requested day names the church that asked (L2-057.1). */
  protected explain(grid: CalendarGridDay): void {
    const day = this.store.days().find((candidate) => candidate.date === grid.date);
    if (!day) return;
    const date = this.format.shortDate(day.date);
    if (day.status === 'booked') {
      const title = this.t('toast.booked.title', { date });
      this.toasts.show({
        variant: 'info',
        kind: this.t('toast.booked.kind'),
        title,
        text: this.t('toast.booked.text', { church: day.church ?? '' }),
        dismissLabel: this.transloco.translate('common.toast.dismiss', { title }),
        key: `calendar-${day.date}`,
      });
    } else if (day.status === 'requested') {
      const title = this.t('toast.requested.title', { date, count: day.requestCount });
      this.toasts.show({
        variant: 'info',
        kind: this.t('toast.requested.kind'),
        title,
        text: this.t('toast.requested.text', {
          church: day.church ?? '',
          kind: this.kindLabel(day.kind).toLocaleLowerCase('en-CA'),
        }),
        actions: [{ label: this.t('toast.requested.action'), link: '/artist/requests' }],
        dismissLabel: this.transloco.translate('common.toast.dismiss', { title }),
        key: `calendar-${day.date}`,
      });
    }
  }

  private gridDay(day: ArtistCalendarDay): CalendarGridDay {
    const date = this.format.shortDate(day.date);
    switch (day.status) {
      case 'booked':
        return {
          date: day.date,
          status: 'booked',
          label: this.t('day.booked', { date, church: day.church ?? '' }),
          event: firstWords(day.church ?? ''),
          selectable: false,
        };
      case 'requested':
        return {
          date: day.date,
          status: 'requested',
          label: this.t('day.requested', {
            date,
            count: day.requestCount,
            church: day.church ?? '',
          }),
          event: this.t('event.requested', { count: day.requestCount }),
        };
      case 'unavailable':
        return day.cause === 'weekly-default'
          ? {
              date: day.date,
              status: 'blocked',
              label: this.t('day.weekly', { date }),
              event: this.t('event.weekly'),
            }
          : {
              date: day.date,
              status: 'blocked',
              label: day.note
                ? this.t('day.chosen', { date, note: day.note })
                : this.t('day.chosenNoNote', { date }),
              event: day.note ?? this.t('event.unavailable'),
            };
      default:
        return { date: day.date, status: 'free', label: this.t('day.free', { date }) };
    }
  }

  private scheduleRow(day: ArtistCalendarDay): ScheduleRow {
    const stamp = this.format.dayStamp(day.date);
    const kind = this.kindLabel(day.kind);
    return {
      id: day.date,
      dayLabel: stamp.weekday,
      dayValue: stamp.day,
      title: day.church ?? '',
      note:
        day.status === 'booked'
          ? this.t('schedule.bookedNote', { kind, city: day.city ?? '' })
          : this.t('schedule.requestedNote', { count: day.requestCount, kind }),
      stamp: day.status === 'booked' ? 'confirmed' : 'requested',
    };
  }

  private unavailableRow(run: UnavailableRun): ScheduleRow {
    const stamp = this.format.dayStamp(run.from.date);
    return {
      id: run.from.date,
      dayLabel: stamp.weekday,
      dayValue: stamp.day,
      title: run.from.note ?? this.t('schedule.unavailable'),
      note:
        run.from.date === run.to.date
          ? undefined
          : this.t('schedule.through', { date: this.format.shortDate(run.to.date) }),
      stamp: null,
    };
  }

  private kindLabel(kind: GatheringKind | null): string {
    return kind ? this.transloco.translate(`discover.kind.${kind}`) : '';
  }

  private monthNameOf(month: string): string {
    return new Intl.DateTimeFormat('en-CA', { month: 'long', timeZone: 'UTC' }).format(
      new Date(`${month}-01T00:00:00Z`),
    );
  }

  private list(items: string[]): string {
    return new Intl.ListFormat('en-CA', { type: 'conjunction' }).format(items);
  }

  private t(key: string, params: Record<string, unknown> = {}): string {
    return this.transloco.translate(`availability.${key}`, params);
  }
}

function addDay(date: CalendarDate): CalendarDate {
  const next = new Date(`${date}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  return next.toISOString().slice(0, 10);
}

/** "Harvest Point" from "Harvest Point Church": the name without its last word, when it has several. */
function firstWords(name: string): string {
  const words = name.split(' ');
  return words.length > 2 ? words.slice(0, 2).join(' ') : (words[0] ?? name);
}
