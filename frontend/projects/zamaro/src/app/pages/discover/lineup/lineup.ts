import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { FormatService, type LineupCard } from 'api';
import { Alert, Button, ButtonAnchor, Headliner, Icon, Skeleton, Ticket } from 'components';
import { actLine } from '../../../shared/act-line';
import { SearchStore } from '../search.store';

interface CardView {
  card: LineupCard;
  positionLabel: string;
  actLine: string;
  price: string;
  ratingLabel: string;
  ratingCount: string;
}

const CONTACT_EMAIL = 'hello@zamaro.ca';
const STATUS_PAGE = 'https://status.zamaro.ca';
/** The status page joins the error after this many failures in a row (L2-106.3). */
const FAILURES_BEFORE_STATUS_LINK = 3;
const SKELETON_TICKETS = [0, 1, 2, 3];

/**
 * The lineup (docs/mocks/pages/discover): the headliner as "No. 01", then the tickets closest first
 * from "No. 02" (L2-006). While a search takes longer than 300 ms it shows skeletons in a busy
 * region (L2-105); a failure or the rate limit shows an alert and keeps the criteria (L2-106,
 * L2-077).
 */
@Component({
  selector: 'zm-lineup',
  imports: [Alert, Button, ButtonAnchor, Headliner, Icon, Skeleton, Ticket, TranslocoPipe],
  templateUrl: './lineup.html',
  styleUrl: './lineup.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Lineup {
  protected readonly store = inject(SearchStore);
  private readonly format = inject(FormatService);
  private readonly transloco = inject(TranslocoService);

  protected readonly contactHref = `mailto:${CONTACT_EMAIL}`;
  protected readonly statusPage = STATUS_PAGE;
  protected readonly skeletonTickets = SKELETON_TICKETS;

  private readonly date = computed(() => this.store.query()?.date ?? '');
  protected readonly longDate = computed(() => this.format.longDate(this.date()));
  protected readonly showStatusLink = computed(
    () => this.store.consecutiveFailures() >= FAILURES_BEFORE_STATUS_LINK,
  );

  protected readonly kicker = computed(() => {
    const date = this.format.shortDate(this.date());
    switch (this.store.status()) {
      case 'loaded':
        return this.t('discover.lineup.summary', {
          date,
          count: this.store.result()?.total ?? 0,
          radius: this.store.query()?.radius,
        });
      case 'error':
        return this.t('discover.lineup.unavailable', { date });
      case 'limited':
        return this.t('discover.lineup.paused', { date });
      default:
        return this.t('discover.lineup.checking', { date });
    }
  });

  protected readonly listLabel = computed(() =>
    this.t(
      this.store.result()?.headliner ? 'discover.lineup.moreLabel' : 'discover.lineup.listLabel',
      {
        date: this.longDate(),
      },
    ),
  );

  protected readonly headliner = computed(() => {
    const card = this.store.result()?.headliner;
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
      badge: this.t('discover.headliner.free', { date: this.format.shortDate(this.date()) }),
      profileLabel: this.t('discover.headliner.profile', { name: this.callName(card) }),
    };
  });

  protected readonly tickets = computed(() => {
    const result = this.store.result();
    if (!result) return [];
    const first = result.headliner ? 2 : 1;
    return result.cards.map((card, index) => ({
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

  protected t(key: string, params?: Record<string, unknown>): string {
    return this.transloco.translate(key, params);
  }
}
