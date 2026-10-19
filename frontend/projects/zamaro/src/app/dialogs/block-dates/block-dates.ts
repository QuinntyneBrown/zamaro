import { Dialog as CdkDialog, DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  signal,
  viewChild,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import {
  type AffectedRequest,
  ARTIST_CALENDAR_API,
  type ArtistCalendarDay,
  type CalendarDate,
  type DateRange,
  FormatService,
  isRangeWarning,
  type RangeResult,
} from 'api';
import {
  Alert,
  Button,
  Dialog,
  ErrorSummary,
  type ErrorSummaryItem,
  FormField,
  Icon,
} from 'components';
import { dayList } from '../../shared/day-list';

export interface BlockDatesData {
  /** The month on show, `YYYY-MM`, for the kicker. */
  month: string;
  /** The days of that month, to say what the range already holds. */
  days: readonly ArtistCalendarDay[];
  /** The calendar window: the earliest and latest date the fields take. */
  earliest: CalendarDate;
  latest: CalendarDate;
  /** A range to start from (the bulk bar's selection), with the warning the API gave it. */
  from?: CalendarDate;
  to?: CalendarDate;
  warning?: AffectedRequest[];
}

/** What the dialog closes with: the saved range and what it changed, or nothing when cancelled. */
export type BlockDatesResult = (RangeResult & { range: DateRange }) | undefined;

const TITLE_ID = 'block-dates-title';
const DESCRIPTION_ID = 'block-dates-desc';

/**
 * Opens "Mark dates unavailable" (docs/mocks/dialogs/block-dates) over the calendar: it traps
 * focus, closes on Escape unless a save is out, and returns focus to the button that opened it.
 */
export function openBlockDatesDialog(
  injector: Injector,
  data: BlockDatesData,
): DialogRef<BlockDatesResult, BlockDates> {
  return injector.get(CdkDialog).open<BlockDatesResult, BlockDatesData, BlockDates>(BlockDates, {
    data,
    ariaLabelledBy: TITLE_ID,
    ariaDescribedBy: DESCRIPTION_ID,
    ariaModal: true,
    autoFocus: false,
    restoreFocus: true,
    backdropClass: 'zm-backdrop',
    maxWidth: '100vw',
  });
}

type Status = 'idle' | 'invalid' | 'busy' | 'warning' | 'failed';

/**
 * L2-056.3, L2-057.1 and L2-057.2: a start date, an end date and a private note. The save tells
 * the artist which Booked days stay booked; when a church has asked about a date in the range the
 * API answers a warning first, and "Mark unavailable and decline" sends the range again confirmed.
 */
@Component({
  selector: 'zm-block-dates-dialog',
  imports: [
    Alert,
    Button,
    Dialog,
    ErrorSummary,
    FormField,
    Icon,
    ReactiveFormsModule,
    TranslocoPipe,
  ],
  templateUrl: './block-dates.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlockDates {
  protected readonly dialogRef = inject<DialogRef<BlockDatesResult>>(DialogRef);
  protected readonly data = inject<BlockDatesData>(DIALOG_DATA);
  private readonly api = inject(ARTIST_CALENDAR_API);
  private readonly format = inject(FormatService);
  private readonly transloco = inject(TranslocoService);
  private readonly injector = inject(Injector);

  protected readonly titleId = TITLE_ID;
  protected readonly descriptionId = DESCRIPTION_ID;
  protected readonly form = inject(NonNullableFormBuilder).group({
    from: [this.data.from ?? ''],
    to: [this.data.to ?? this.data.from ?? ''],
    note: [''],
  });
  protected readonly status = signal<Status>(this.data.warning ? 'warning' : 'idle');
  protected readonly warning = signal<AffectedRequest[]>(this.data.warning ?? []);
  /** The field errors of the last attempt, by field. */
  protected readonly errors = signal<Partial<Record<'from' | 'to' | 'note', string>>>({});
  private readonly values = signal(this.form.getRawValue());
  protected readonly busy = computed(() => this.status() === 'busy');

  private readonly startField = viewChild<FormField>('startField');
  private readonly endField = viewChild<FormField>('endField');
  private readonly noteField = viewChild<FormField>('noteField');
  private readonly keepButton = viewChild('keepButton', { read: ElementRef<HTMLElement> });

  /** "Availability · November 2026". */
  protected readonly kicker = computed(() =>
    this.t('kicker', { month: this.format.monthYear(this.data.month) }),
  );

  /** The dates in the range, when it is one. */
  private readonly dates = computed<CalendarDate[]>(() => {
    const { from, to } = this.values();
    if (!isDate(from) || !isDate(to) || to < from) return [];
    const dates: CalendarDate[] = [];
    for (let date = from; date <= to && dates.length <= 600; date = nextDate(date))
      dates.push(date);
    return dates;
  });

  /** "2 days: Thu 26 and Fri 27 Nov. No church has asked about these dates. Booked days in a range stay booked." */
  protected readonly summary = computed(() => {
    const dates = this.dates();
    if (dates.length === 0) return '';
    const count = this.t('summary.count', {
      count: dates.length,
      days: dayList(dates, dates.length > 2 ? 'to' : 'and', this.format),
    });
    const inMonth = this.data.days.filter((day) => dates.includes(day.date));
    const weekly = inMonth.filter(
      (day) => day.status === 'unavailable' && day.cause === 'weekly-default',
    );
    const asked = inMonth.filter((day) => day.status === 'requested');
    const notes: string[] = [];
    if (weekly.length) {
      notes.push(
        this.t('summary.weekly', {
          count: weekly.length,
          days: dayList(
            weekly.map((day) => day.date),
            'and',
            this.format,
          ),
        }),
      );
    }
    notes.push(
      asked.length ? this.t('summary.asked', { count: asked.length }) : this.t('summary.noneAsked'),
    );
    notes.push(this.t('summary.booked'));
    return `${count} ${notes.join(' ')}`;
  });

  /** "Mark 2 days unavailable", or "Mark dates unavailable" while the range is not one. */
  protected readonly actionLabel = computed(() => {
    const count = this.dates().length;
    return count ? this.t('markCount', { count }) : this.t('mark');
  });

  /** "Keep Sun 22 Nov open": the first affected date. */
  protected readonly keepLabel = computed(() => {
    const first = this.warning()[0];
    return first ? this.t('keep', { date: this.format.shortDate(first.date) }) : this.t('cancel');
  });

  protected readonly warningTitle = computed(() =>
    this.t('warning.title', { count: new Set(this.warning().map((r) => r.church)).size }),
  );

  protected readonly warningLines = computed(() =>
    this.warning().map((request) =>
      this.t('warning.line', {
        church: request.church,
        date: this.format.shortDate(request.date),
      }),
    ),
  );

  /** "Those dates weren’t saved" / "Thu 26 and Fri 27 Nov are still Free to churches. …" */
  protected readonly failedText = computed(() =>
    this.t('failed.text', { days: dayList(this.dates(), 'and', this.format) }),
  );

  protected readonly summaryItems = computed<ErrorSummaryItem[]>(() =>
    Object.entries(this.errors()).map(([field, message]) => ({
      fieldId: `block-${field}`,
      message: message ?? '',
    })),
  );

  constructor() {
    this.form.valueChanges.subscribe(() => this.values.set(this.form.getRawValue()));
    afterNextRender(
      () => {
        if (this.status() === 'warning') this.focusKeep();
        else this.startField()?.focus();
      },
      { injector: this.injector },
    );
  }

  protected submit(): void {
    if (this.busy()) return;
    const { from, to, note } = this.form.getRawValue();
    const errors: Partial<Record<'from' | 'to' | 'note', string>> = {};
    if (!isDate(from)) errors.from = this.t('errors.start');
    if (!isDate(to)) errors.to = this.t('errors.end');
    else if (isDate(from) && to < from) errors.to = this.t('errors.order');
    if (note.length > 100) errors.note = this.t('errors.note');
    this.errors.set(errors);
    if (Object.keys(errors).length) {
      this.status.set('invalid');
      return;
    }
    const range: DateRange = {
      from,
      to,
      state: 'unavailable',
      note: note.trim() || null,
      confirm: this.status() === 'warning',
    };
    this.status.set('busy');
    this.dialogRef.disableClose = true;
    this.api.setDates(range).subscribe({
      next: (result) => {
        this.dialogRef.disableClose = false;
        if (isRangeWarning(result)) {
          this.warning.set(result.affectedRequests);
          this.status.set('warning');
          afterNextRender(() => this.focusKeep(), { injector: this.injector });
          return;
        }
        this.dialogRef.close({ ...result, range });
      },
      error: () => {
        this.dialogRef.disableClose = false;
        this.status.set('failed');
      },
    });
  }

  /** The way back: Cancel, or "Keep {date} open" after the warning. */
  protected close(): void {
    if (this.busy()) return;
    this.dialogRef.close();
  }

  private focusKeep(): void {
    this.keepButton()?.nativeElement.querySelector('button')?.focus();
  }

  protected focusField(fieldId: string): void {
    if (fieldId === 'block-from') this.startField()?.focus();
    else if (fieldId === 'block-to') this.endField()?.focus();
    else this.noteField()?.focus();
  }

  protected error(field: 'from' | 'to' | 'note'): string | null {
    return this.status() === 'invalid' ? (this.errors()[field] ?? null) : null;
  }

  private t(key: string, params: Record<string, unknown> = {}): string {
    return this.transloco.translate(`availability.blockDates.${key}`, params);
  }
}

function isDate(value: string): value is CalendarDate {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function nextDate(date: CalendarDate): CalendarDate {
  const next = new Date(`${date}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  return next.toISOString().slice(0, 10);
}
