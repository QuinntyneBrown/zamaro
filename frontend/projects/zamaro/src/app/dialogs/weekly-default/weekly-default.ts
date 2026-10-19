import { Dialog as CdkDialog, DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  Injector,
  signal,
  viewChild,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import { ARTIST_CALENDAR_API } from 'api';
import { Alert, Button, Checkbox, CheckboxGroup, Dialog, Icon } from 'components';

export interface WeeklyDefaultData {
  /** The ISO weekdays (1 is Monday) unavailable today. */
  unavailableWeekdays: readonly number[];
  /** "Unavailable every Monday", or "none", as the page words the default today. */
  current: string;
}

/** What the dialog closes with: the saved weekdays, or nothing when cancelled. */
export type WeeklyDefaultResult = number[] | undefined;

const TITLE_ID = 'weekly-default-title';
const DESCRIPTION_ID = 'weekly-default-desc';

/** The checkboxes from Sunday, each with its ISO weekday. */
const WEEKDAYS: { key: string; iso: number }[] = [
  { key: 'sun', iso: 7 },
  { key: 'mon', iso: 1 },
  { key: 'tue', iso: 2 },
  { key: 'wed', iso: 3 },
  { key: 'thu', iso: 4 },
  { key: 'fri', iso: 5 },
  { key: 'sat', iso: 6 },
];

/** Opens "Weekly default" (docs/mocks/dialogs/weekly-default) over the calendar. */
export function openWeeklyDefaultDialog(
  injector: Injector,
  data: WeeklyDefaultData,
): DialogRef<WeeklyDefaultResult, WeeklyDefault> {
  return injector
    .get(CdkDialog)
    .open<WeeklyDefaultResult, WeeklyDefaultData, WeeklyDefault>(WeeklyDefault, {
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

type Status = 'idle' | 'busy' | 'failed';

/**
 * L2-056.2: a checkbox per weekday under "Unavailable every"; any combination is valid, including
 * none. A failed save keeps the ticks and says the old default still applies.
 */
@Component({
  selector: 'zm-weekly-default-dialog',
  imports: [
    Alert,
    Button,
    Checkbox,
    CheckboxGroup,
    Dialog,
    Icon,
    ReactiveFormsModule,
    TranslocoPipe,
  ],
  template: `<form class="dialog__form" novalidate (submit)="submit($event)">
    <zm-dialog
      icon="swap"
      iconTone="info"
      [kicker]="'availability.weeklyDefault.kicker' | transloco"
      [heading]="'availability.weeklyDefault.title' | transloco"
      [titleId]="titleId"
      [description]="'availability.weeklyDefault.description' | transloco"
      [descriptionId]="descriptionId"
      [closeLabel]="'availability.weeklyDefault.close' | transloco"
      [busy]="busy()"
      (closed)="close()"
    >
      @if (status() === 'failed') {
        <zm-alert
          variant="danger"
          compact
          [heading]="'availability.weeklyDefault.failed.title' | transloco"
        >
          <p>
            {{ 'availability.weeklyDefault.failed.text' | transloco: { current: data.current } }}
          </p>
        </zm-alert>
      }
      <zm-checkbox-group
        #group
        id="weekly-days"
        name="weekly-days"
        [formControl]="days"
        [legend]="'availability.weeklyDefault.legend' | transloco"
        [optionalMarker]="'availability.weeklyDefault.chooseAny' | transloco"
      >
        @for (weekday of weekdays; track weekday.key) {
          <zm-checkbox [id]="'weekly-' + weekday.key" [value]="weekday.key">{{
            'availability.weekday.' + weekday.key + '.long' | transloco
          }}</zm-checkbox>
        }
      </zm-checkbox-group>
      <p class="text-muted">{{ 'availability.weeklyDefault.applies' | transloco }}</p>
      <zm-button slot="footer" [disabled]="busy()" (click)="close()">{{
        'availability.weeklyDefault.cancel' | transloco
      }}</zm-button>
      <zm-button slot="footer" type="submit" variant="primary" [busy]="busy()"
        ><zm-icon [name]="status() === 'failed' ? 'refresh' : 'check'" />{{
          busy()
            ? ('availability.weeklyDefault.saving' | transloco)
            : status() === 'failed'
              ? ('availability.weeklyDefault.tryAgain' | transloco)
              : ('availability.weeklyDefault.save' | transloco)
        }}</zm-button
      >
    </zm-dialog>
  </form>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeeklyDefault {
  protected readonly dialogRef = inject<DialogRef<WeeklyDefaultResult>>(DialogRef);
  protected readonly data = inject<WeeklyDefaultData>(DIALOG_DATA);
  private readonly api = inject(ARTIST_CALENDAR_API);

  protected readonly titleId = TITLE_ID;
  protected readonly descriptionId = DESCRIPTION_ID;
  protected readonly weekdays = WEEKDAYS;
  protected readonly days = new FormControl<string[]>(
    WEEKDAYS.filter((weekday) => this.data.unavailableWeekdays.includes(weekday.iso)).map(
      (weekday) => weekday.key,
    ),
    { nonNullable: true },
  );
  protected readonly status = signal<Status>('idle');
  protected readonly busy = computed(() => this.status() === 'busy');

  private readonly group = viewChild<CheckboxGroup>('group');

  constructor() {
    afterNextRender(() => this.group()?.focus(), { injector: inject(Injector) });
  }

  protected submit(event: Event): void {
    event.preventDefault();
    if (this.busy()) return;
    const chosen = new Set(this.days.value);
    const unavailableWeekdays = WEEKDAYS.filter((weekday) => chosen.has(weekday.key))
      .map((weekday) => weekday.iso)
      .sort((a, b) => a - b);
    this.status.set('busy');
    this.days.disable();
    this.dialogRef.disableClose = true;
    this.api.setWeekly(unavailableWeekdays).subscribe({
      next: (saved) => {
        this.dialogRef.disableClose = false;
        this.dialogRef.close(saved);
      },
      error: () => {
        this.dialogRef.disableClose = false;
        this.days.enable();
        this.status.set('failed');
      },
    });
  }

  protected close(): void {
    if (this.busy()) return;
    this.dialogRef.close();
  }
}
