import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { FormatService, type LineupCard, type SearchQuery, type SearchResult } from 'api';
import { Headliner, Ticket } from 'components';
import { actLine } from '../../../shared/act-line';

interface CardView {
  card: LineupCard;
  positionLabel: string;
  actLine: string;
  price: string;
  ratingLabel: string;
  ratingCount: string;
}

/**
 * The lineup (docs/mocks/pages/discover/default.html): a summary line, the headliner as "No. 01",
 * then the tickets closest first from "No. 02" (L2-006).
 */
@Component({
  selector: 'zm-lineup',
  imports: [Headliner, Ticket, TranslocoPipe],
  templateUrl: './lineup.html',
  styleUrl: './lineup.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Lineup {
  readonly query = input.required<SearchQuery>();
  readonly result = input.required<SearchResult>();

  private readonly format = inject(FormatService);
  private readonly transloco = inject(TranslocoService);

  protected readonly summary = computed(() =>
    this.t('discover.lineup.summary', {
      date: this.format.shortDate(this.query().date),
      count: this.result().total,
      radius: this.query().radius,
    }),
  );

  protected readonly listLabel = computed(() =>
    this.t(this.result().headliner ? 'discover.lineup.moreLabel' : 'discover.lineup.listLabel', {
      date: this.format.longDate(this.query().date),
    }),
  );

  protected readonly headliner = computed(() => {
    const card = this.result().headliner;
    if (!card) return null;
    return {
      ...this.view(card, 1),
      kicker: this.t('discover.headliner.kicker', { season: card.season }),
      placeLine: this.t('discover.headliner.place', {
        city: card.city,
        distance: this.format.distance(card.distance.km, card.distance.approximate),
      }),
      priceLine: this.t('discover.headliner.from', {
        price: this.format.money(card.fromPrice.cents),
      }),
      quote: card.quote?.text ?? null,
      attribution: card.quote ? `${card.quote.reviewerName}, ${card.quote.city}` : '',
      badge: this.t('discover.headliner.free', { date: this.format.shortDate(this.query().date) }),
      profileLabel: this.t('discover.headliner.profile', { name: this.callName(card) }),
    };
  });

  protected readonly tickets = computed(() => {
    const first = this.result().headliner ? 2 : 1;
    return this.result().cards.map((card, index) => ({
      ...this.view(card, first + index),
      placeLine: this.t('discover.ticket.place', {
        city: card.city,
        distance: this.format.distance(card.distance.km, card.distance.approximate),
      }),
    }));
  });

  protected artVariant(card: LineupCard): 'solo' | 'group' {
    return card.actType === 'solo' ? 'solo' : 'group';
  }

  private view(card: LineupCard, position: number): CardView {
    return {
      card,
      positionLabel: this.t('discover.ticket.position', {
        position: String(position).padStart(2, '0'),
      }),
      actLine: actLine(card.actType, card.styles, (key) => this.t(key)),
      price: this.format.money(card.fromPrice.cents),
      ratingLabel:
        card.rating === null
          ? this.t('common.rating.new')
          : this.t('common.rating.label', {
              rating: card.rating.toFixed(1),
              count: card.reviewCount,
            }),
      ratingCount: this.t('common.rating.churches', { count: card.reviewCount }),
    };
  }

  /** A solo artist by first name ("See Abigail’s profile"); a group by its full name. */
  private callName(card: LineupCard): string {
    return card.actType === 'solo' ? card.name.split(' ')[0] : card.name;
  }

  private t(key: string, params?: Record<string, unknown>): string {
    return this.transloco.translate(key, params);
  }
}
