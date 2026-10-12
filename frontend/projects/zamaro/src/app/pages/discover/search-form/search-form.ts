import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import {
  addDays,
  addMonths,
  DISCOVERY_API,
  GATHERING_KINDS,
  type GatheringKind,
  type Place,
  RADII_KM,
  type RadiusKm,
  torontoToday,
} from 'api';
import {
  BookingForm,
  Button,
  Chip,
  ErrorSummary,
  type ErrorSummaryItem,
  type FieldOption,
  ChipGroup,
  FormField,
} from 'components';
import { firstValueFrom } from 'rxjs';
import { SearchStore } from '../search.store';

/** The quick-pick cities (L2-004.6); each resolves to its centre through the place lookup. */
export const QUICK_PICK_CITIES = [
  'Toronto',
  'Burlington',
  'Mississauga',
  'Brampton',
  'Hamilton',
  'Markham',
  'Ajax',
  'Oshawa',
  'Barrie',
  'Kitchener',
  'Niagara',
] as const;

type FieldName = 'date' | 'location';

const FIELD_IDS: Record<FieldName, string> = { date: 'find-date', location: 'find-place' };

/** The precision coordinates keep in the address bar (L2-009.4). */
function roundTo3(value: number): number {
  return Math.round(value * 1000) / 1000;
}

/**
 * "Your event" (L2-004): date, kind of gathering, church location (typed, or a city chip) and radius.
 * Empty or out-of-window fields show inline errors and a summary, focus moves to the first invalid
 * field, and no search runs.
 */
@Component({
  selector: 'zm-search-form',
  imports: [
    BookingForm,
    Button,
    Chip,
    ErrorSummary,
    ChipGroup,
    FormField,
    ReactiveFormsModule,
    TranslocoPipe,
  ],
  templateUrl: './search-form.html',
  styleUrl: './search-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchForm {
  protected readonly store = inject(SearchStore);
  private readonly api = inject(DISCOVERY_API);
  private readonly transloco = inject(TranslocoService);

  protected readonly cities = QUICK_PICK_CITIES;
  protected readonly today = torontoToday();
  protected readonly earliest = addDays(this.today, 3);
  protected readonly latest = addMonths(this.today, 18);

  protected readonly form = inject(NonNullableFormBuilder).group({
    date: '',
    kind: 'sunday-service' as string,
    location: '',
    radius: '120',
  });

  protected readonly kinds: FieldOption[] = GATHERING_KINDS.map((kind) => ({
    value: kind,
    label: this.t(`discover.kind.${kind}`),
  }));
  protected readonly radii: FieldOption[] = RADII_KM.map((km) => ({
    value: String(km),
    label: this.t(`discover.radius.${km}`),
  }));

  /** The place the location field currently names, once resolved to coordinates. */
  protected readonly place = signal<Place | null>(null);
  protected readonly errors = signal<Partial<Record<FieldName, string>>>({});
  protected readonly errorCount = computed(() => Object.keys(this.errors()).length);

  private pendingCity: Promise<void> = Promise.resolve();
  private readonly dateField = viewChild.required<FormField>('dateField');
  private readonly locationField = viewChild.required<FormField>('locationField');

  constructor() {
    this.form.controls.location.valueChanges.pipe(takeUntilDestroyed()).subscribe((text) => {
      if (text !== this.place()?.label) {
        this.place.set(null);
      }
    });
    // The address bar is the source of truth: show whatever search it holds.
    effect(() => {
      const state = this.store.state();
      untracked(() => {
        // The place this form already resolved keeps its label ("Burlington, ON") as entered.
        const current = this.place();
        const samePlace =
          current !== null &&
          current.city === state.place &&
          roundTo3(current.lat) === state.lat &&
          roundTo3(current.lng) === state.lng;
        if (!samePlace) {
          this.place.set(
            state.lat !== null && state.lng !== null
              ? { label: state.place, city: state.place, lat: state.lat, lng: state.lng }
              : null,
          );
        }
        this.form.setValue({
          date: state.date,
          kind: state.kind,
          location: samePlace ? current.label : state.place,
          radius: String(state.radius),
        });
      });
    });
  }

  protected pickCity(city: string): Promise<void> {
    this.pendingCity = firstValueFrom(this.api.lookUpPlace(city)).then((place) => {
      if (place) {
        this.place.set(place);
        this.form.controls.location.setValue(place.label);
      }
    });
    return this.pendingCity;
  }

  protected async submit(): Promise<void> {
    if (this.store.status() === 'loading') return;
    // A chip pressed just before submitting still counts.
    await this.pendingCity;
    const { date, kind, location, radius } = this.form.getRawValue();
    const errors: Partial<Record<FieldName, string>> = {};
    const dateError = this.dateError(date);
    if (dateError) errors.date = dateError;
    if (!location.trim()) errors.location = this.t('discover.errors.locationRequired');
    if (this.show(errors)) return;

    const place = this.place() ?? (await firstValueFrom(this.api.lookUpPlace(location.trim())));
    if (!place) {
      this.show({ location: this.t('discover.errors.locationRequired') });
      return;
    }
    this.place.set(place);
    this.store.navigate(
      {
        date,
        kind: kind as GatheringKind,
        lat: place.lat,
        lng: place.lng,
        place: place.city,
        radius: Number(radius) as RadiusKm,
      },
      { replace: false },
    );
  }

  /** The summary links to a field; focus it rather than follow the fragment. */
  /** One link per invalid field, date first; the location's link has its own wording. */
  protected readonly summaryItems = computed<ErrorSummaryItem[]>(() => {
    const errors = this.errors();
    return (['date', 'location'] as const)
      .filter((field) => errors[field])
      .map((field) => ({
        fieldId: FIELD_IDS[field],
        message: field === 'location' ? this.t('discover.errors.summaryLocation') : errors[field]!,
      }));
  });

  private dateError(date: string): string | null {
    if (!date) return this.t('discover.errors.dateRequired');
    if (date < this.earliest) return this.t('discover.errors.dateTooSoon');
    if (date > this.latest) return this.t('discover.errors.dateTooFar');
    return null;
  }

  /** Shows the errors and focuses the first invalid field; true when there are any. */
  private show(errors: Partial<Record<FieldName, string>>): boolean {
    this.errors.set(errors);
    const first = (['date', 'location'] as const).find((field) => errors[field]);
    if (first) this.fieldFor(first).focus();
    return first !== undefined;
  }

  private fieldFor(field: FieldName): FormField {
    return field === 'date' ? this.dateField() : this.locationField();
  }

  private t(key: string, params?: Record<string, unknown>): string {
    return this.transloco.translate(key, params);
  }
}
