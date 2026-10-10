import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { FormatService, type LineupCard, type SearchQuery, type SearchResult } from 'api';
import { Ticket } from 'components';
import { actLine } from '../../../shared/act-line';

interface TicketView {
  card: LineupCard;
  positionLabel: string;
  actLine: string;
  placeLine: string;
  price: string;
  ratingLabel: string;
  ratingCount: string;
}

/** The lineup (docs/mocks/pages/discover/default.html): a summary line and the tickets, closest first. */
@Component({
  selector: 'zm-lineup',
  imports: [Ticket, TranslocoPipe],
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
    this.t('discover.lineup.listLabel', { date: this.format.longDate(this.query().date) }),
  );

  protected readonly tickets = computed<TicketView[]>(() =>
    this.result().cards.map((card, index) => ({
      card,
      positionLabel: this.t('discover.ticket.position', {
        position: String(index + 1).padStart(2, '0'),
      }),
      actLine: actLine(card.actType, card.styles, (key) => this.t(key)),
      placeLine: this.t('discover.ticket.place', {
        city: card.city,
        distance: this.format.distance(card.distance.km, card.distance.approximate),
      }),
      price: this.format.money(card.fromPrice.cents),
      ratingLabel:
        card.rating === null
          ? this.t('common.rating.new')
          : this.t('common.rating.label', {
              rating: card.rating.toFixed(1),
              count: card.reviewCount,
            }),
      ratingCount: this.t('common.rating.churches', { count: card.reviewCount }),
    })),
  );

  protected artVariant(card: LineupCard): 'solo' | 'group' {
    return card.actType === 'solo' ? 'solo' : 'group';
  }

  private t(key: string, params?: Record<string, unknown>): string {
    return this.transloco.translate(key, params);
  }
}
