import { LiveAnnouncer } from '@angular/cdk/a11y';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  Injector,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import {
  FormatService,
  type LineupCard,
  SEARCH_SORTS,
  type SearchSort,
  STYLES,
  type Style,
} from 'api';
import {
  Alert,
  Button,
  ButtonAnchor,
  Chip,
  type FieldOption,
  ChipGroup,
  FormField,
  Headliner,
  HeadlinerSkeleton,
  Icon,
  Ticket,
  TicketSkeleton,
} from 'components';
import { actLine } from '../../../shared/act-line';
import { SearchStore } from '../search.store';
import { SoldOut } from '../sold-out/sold-out';

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
  imports: [
    Alert,
    Button,
    ButtonAnchor,
    Chip,
    ChipGroup,
    FormField,
    Headliner,
    HeadlinerSkeleton,
    Icon,
    ReactiveFormsModule,
    SoldOut,
    Ticket,
    TicketSkeleton,
    TranslocoPipe,
  ],
  templateUrl: './lineup.html',
  styleUrl: './lineup.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Lineup {
  protected readonly store = inject(SearchStore);
  private readonly format = inject(FormatService);
  private readonly transloco = inject(TranslocoService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  protected readonly styles = STYLES;
  protected readonly sortControl = new FormControl<string>('closest', { nonNullable: true });
  protected readonly sorts: FieldOption[] = SEARCH_SORTS.map((sort) => ({
    value: sort,
    label: this.t(`discover.sort.${sort}`),
  }));

  constructor() {
    effect(() => this.sortControl.setValue(this.store.state().sort, { emitEvent: false }));
    this.sortControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((sort) => this.store.navigate({ sort: sort as SearchSort }, { replace: true }));
    // L2-102.2: the summary line is announced politely after each search.
    const announcer = inject(LiveAnnouncer);
    effect(() => {
      if (this.store.status() === 'loaded') {
        const summary = this.kicker();
        untracked(() => void announcer.announce(summary, 'polite'));
      }
    });
  }

  /** Appends the next page and moves focus to its first ticket (L2-010.2). */
  protected async showMore(): Promise<void> {
    const firstNew = this.tickets().length;
    if (!(await this.store.loadMore())) return;
    afterNextRender(
      () =>
        this.host.nativeElement
          .querySelectorAll<HTMLElement>('.lineup > li')
          [firstNew]?.querySelector<HTMLElement>('a')
          ?.focus(),
      { injector: this.injector },
    );
  }

  protected isPressed(style: Style): boolean {
    return this.store.state().styles.includes(style);
  }

  protected toggleStyle(style: Style): void {
    const styles = this.store.state().styles;
    const next = styles.includes(style)
      ? styles.filter((each) => each !== style)
      : [...styles, style];
    this.store.navigate(
      { styles: STYLES.filter((each) => next.includes(each)) },
      { replace: true },
    );
  }

  protected toggleUnder800(): void {
    this.store.navigate({ under800: !this.store.state().under800 }, { replace: true });
  }

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
