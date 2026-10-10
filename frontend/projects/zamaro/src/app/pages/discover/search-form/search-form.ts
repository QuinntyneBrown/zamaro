import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
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
import { BookingForm, Button, Chip, type FieldOption, FormField } from 'components';
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

/**
 * "Your event" (L2-004): date, kind of gathering, church location (typed, or a city chip) and radius.
 * Empty or out-of-window fields show inline errors and a summary, focus moves to the first invalid
 * field, and no search runs.
 */
@Component({
  selector: 'zm-search-form',
  imports: [BookingForm, Button, Chip, FormField, ReactiveFormsModule, TranslocoPipe],
  templateUrl: './search-form.html',
  styleUrl: './search-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchForm {
  private readonly store = inject(SearchStore);
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
    this.store.search(
      {
        date,
        kind: kind as GatheringKind,
        lat: place.lat,
        lng: place.lng,
        radius: Number(radius) as RadiusKm,
      },
      place.city,
    );
  }

  /** The summary links to a field; focus it rather than follow the fragment. */
  protected focusField(event: Event, field: FieldName): void {
    event.preventDefault();
    this.fieldFor(field).focus();
  }

  protected summaryItem(field: FieldName): string {
    const message = this.errors()[field] ?? '';
    if (field === 'location') return this.t('discover.errors.summaryLocation');
    return message;
  }

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
