import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import type { Params } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { type CalendarDate, FormatService, type SimilarArtists } from 'api';
import { ButtonLink, ErrorPage, Icon, Ticket } from 'components';
import { actLine } from '../../shared/act-line';
import { PageMeta } from '../../shared/page-meta';

/**
 * A missing, suspended or deleted artist (docs/mocks/pages/not-found/artist), in place of the
 * profile at `/artists/{slug}`: "This artist isn’t on Zamaro" and up to 3 similar artists free on
 * the carried date, nearest first (L2-021). It names nothing of the artist who was asked for.
 */
@Component({
  selector: 'zm-artist-not-found-page',
  imports: [ButtonLink, ErrorPage, Icon, Ticket, TranslocoPipe],
  templateUrl: './artist-not-found.html',
  styleUrl: './artist-not-found.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArtistNotFoundPage {
  readonly similar = input.required<SimilarArtists>();
  /** The town of the search it was opened from, or null when it was opened without one. */
  readonly place = input<string | null>(null);
  /** Discover's query parameters for "See the full lineup". */
  readonly lineupParams = input<Params>({});

  private readonly format = inject(FormatService);
  private readonly transloco = inject(TranslocoService);

  constructor() {
    inject(PageMeta).set({ title: this.t('errors.artist.pageTitle'), index: false });
  }

  private readonly date = computed(() => this.similar().date as CalendarDate);

  protected readonly lead = computed(() =>
    this.similar().items.length
      ? this.t('errors.artist.lead', { date: this.format.shortDate(this.date()) })
      : this.t('errors.artist.leadNone'),
  );

  /** "Sat 14 Nov · within 120 km of Burlington", or of Toronto without a search. */
  protected readonly kicker = computed(() =>
    this.t('errors.artist.kicker', {
      date: this.format.shortDate(this.date()),
      radius: this.similar().radiusKm,
      place: this.place() ?? this.t('errors.artist.toronto'),
    }),
  );

  protected readonly listLabel = computed(() =>
    this.t('errors.artist.listLabel', { date: this.format.longDate(this.date()) }),
  );

  protected readonly tickets = computed(() =>
    this.similar().items.map((card, index) => ({
      card,
      positionLabel: this.t('discover.ticket.position', {
        position: String(index + 1).padStart(2, '0'),
      }),
      actLine: actLine(card.actType, card.styles, (key) => this.t(key)),
      placeLine: this.t(
        this.place() ? 'errors.artist.placeFromChurch' : 'errors.artist.placeFromToronto',
        {
          city: card.city,
          distance: this.format.distance(card.distance.km, card.distance.approximate),
        },
      ),
      price: this.format.money(card.fromPrice.cents),
      ratingLabel:
        card.rating === null
          ? this.t('common.rating.new')
          : this.t('common.rating.label', {
              rating: card.rating.toFixed(1),
              count: card.reviewCount,
            }),
      ratingCount: this.t('common.rating.churches', { count: card.reviewCount }),
      artVariant: card.actType === 'solo' ? ('solo' as const) : ('group' as const),
    })),
  );

  protected readonly ticketParams = computed(() => ({ date: this.similar().date }));

  protected t(key: string, params?: Record<string, unknown>): string {
    return this.transloco.translate(key, params);
  }
}
