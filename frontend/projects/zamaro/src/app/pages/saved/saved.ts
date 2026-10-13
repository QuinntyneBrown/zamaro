import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import {
  addDays,
  addMonths,
  type CalendarDate,
  FormatService,
  SAVED_ARTISTS_API,
  type SavedArtistCard,
  type SavedArtistList,
  torontoToday,
} from 'api';
import {
  Alert,
  Badge,
  Button,
  ButtonLink,
  EmptyState,
  FormField,
  Icon,
  SaveToggle,
  Skeleton,
  Ticket,
  TicketSkeleton,
} from 'components';
import { actLine } from '../../shared/act-line';
import { LastSearch } from '../../shared/last-search';
import { PageMeta } from '../../shared/page-meta';
import { SavedArtistsStore } from '../../shared/saved-artists.store';

/**
 * Saved artists at `/saved` (docs/mocks/pages/saved, L2-027): a booker's shortlist newest save first,
 * each free or booked on their most recent search date or one they pick. Removing an artist takes
 * the card away; Undo brings it back.
 */
@Component({
  selector: 'zm-saved-page',
  imports: [
    Alert,
    Badge,
    Button,
    ButtonLink,
    EmptyState,
    FormField,
    Icon,
    ReactiveFormsModule,
    SaveToggle,
    Skeleton,
    Ticket,
    TicketSkeleton,
    TranslocoPipe,
  ],
  templateUrl: './saved.html',
  styleUrl: './saved.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SavedPage {
  private readonly api = inject(SAVED_ARTISTS_API);
  private readonly format = inject(FormatService);
  private readonly transloco = inject(TranslocoService);
  protected readonly saved = inject(SavedArtistsStore);

  private readonly lastSearchDate = inject(LastSearch).lastDate();
  private readonly today = torontoToday();
  protected readonly earliest = addDays(this.today, 3);
  protected readonly latest = addMonths(this.today, 18);
  protected readonly skeletons = [1, 2, 3];

  protected readonly status = signal<'loading' | 'loaded' | 'error'>('loading');
  private readonly list = signal<SavedArtistList | null>(null);
  /** The date the list was checked against. */
  private readonly checked = signal<CalendarDate | null>(this.lastSearchDate);
  /** Hearts pressed on this page; a card leaves while its artist is not saved. */
  private readonly removed = signal<ReadonlySet<number>>(new Set());
  protected readonly dateControl = new FormControl<string>(this.lastSearchDate ?? '', {
    nonNullable: true,
  });

  protected readonly cards = computed(() =>
    (this.list()?.artists ?? []).filter(
      (card) => !this.removed().has(card.id) || this.saved.has(card.id),
    ),
  );

  protected readonly tickets = computed(() => {
    const date = this.checked();
    const shortDate = date ? this.format.shortDate(date) : '';
    return this.cards().map((card) => ({
      card,
      kicker: this.t('savedOn', {
        date: this.format.shortDate(torontoToday(new Date(card.savedAt))),
      }),
      actLine: actLine(card.actType, card.styles, (key) => this.transloco.translate(key)),
      placeLine: card.distance
        ? this.transloco.translate('discover.ticket.place', {
            city: card.city,
            distance: this.format.distance(card.distance.km, card.distance.approximate),
          })
        : card.city,
      price: this.format.money(card.fromPrice.cents),
      queryParams: date ? { date } : ({} as Record<string, string>),
      booked: card.availability === 'booked',
      availability:
        card.availability === null ? null : this.t(card.availability, { date: shortDate }),
      requestFor: this.t('requestFor', { name: card.name, date: shortDate }),
      freeDatesFor: this.t('freeDatesFor', { name: card.name }),
      artVariant: card.actType === 'solo' ? ('solo' as const) : ('group' as const),
    }));
  });

  /** "3 saved · free or booked on Sat 14 Nov, your last search". */
  protected readonly subtitle = computed(() => {
    const status = this.status();
    if (status === 'loading') return null;
    if (status === 'error') return this.t('subtitle.unavailable', { count: this.saved.count() });
    const count = this.cards().length;
    if (count === 0) return this.t('subtitle.empty');
    const date = this.checked();
    if (!date) return this.t('subtitle.noDate', { count });
    return this.t(date === this.lastSearchDate ? 'subtitle.lastSearch' : 'subtitle.date', {
      count,
      date: this.format.shortDate(date),
    });
  });

  constructor() {
    inject(PageMeta).set({ title: this.t('pageTitle'), path: '/saved', index: false });
    this.fetch();
  }

  /** Loads the list for the checked date; Try again calls it after a failure. */
  protected fetch(): void {
    this.status.set('loading');
    this.api.list(this.checked()).subscribe({
      next: (list) => {
        this.list.set(list);
        this.removed.set(new Set());
        this.status.set('loaded');
      },
      error: () => this.status.set('error'),
    });
  }

  /** "Check date": every card again for the picked date. */
  protected check(event: Event): void {
    event.preventDefault();
    const date = this.dateControl.value;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
    this.checked.set(date as CalendarDate);
    this.fetch();
  }

  protected remove(card: SavedArtistCard): void {
    this.removed.update((ids) => new Set(ids).add(card.id));
    this.saved.press({ id: card.id, name: card.name, pronoun: card.pronoun }, false);
  }

  private t(key: string, params: Record<string, unknown> = {}): string {
    return this.transloco.translate(`accounts.saved.${key}`, params);
  }
}
