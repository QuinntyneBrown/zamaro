import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { FormatService, type RadiusKm } from 'api';
import { Button, DateSwap, EmptyState, Icon } from 'components';
import { SearchStore } from '../search.store';

/**
 * "Sold out" (L2-011, docs/mocks/pages/discover/empty.html): why nobody is free, then up to three
 * nearby dates, the smallest wider radius with matches and, when filters apply, "Show all styles".
 * Each way forward changes one part of the search through the address bar.
 */
@Component({
  selector: 'zm-sold-out',
  imports: [Button, DateSwap, EmptyState, Icon, TranslocoPipe],
  templateUrl: './sold-out.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SoldOut {
  protected readonly store = inject(SearchStore);
  private readonly format = inject(FormatService);
  private readonly transloco = inject(TranslocoService);

  /**
   * The one style chip pressed, which names the artists ("choirs"), as an ICU select key
   * (underscores: messageformat rejects hyphens); otherwise "other".
   */
  private readonly style = computed(() => {
    const styles = this.store.state().styles;
    return styles.length === 1 ? styles[0].replace('-', '_') : 'other';
  });
  private readonly when = computed(() => this.format.dateDescription(this.store.state().date));

  protected readonly title = computed(() =>
    this.t('discover.soldOut.title', { when: this.when(), radius: this.store.state().radius }),
  );

  protected readonly explanation = computed(() => {
    const ways = this.store.alternatives();
    const place = this.store.placeName();
    const why = this.t(
      this.style() === 'other' ? 'discover.soldOut.whyAnyone' : 'discover.soldOut.whyStyle',
      {
        style: this.style(),
        place,
        when: this.when(),
      },
    );
    if (!ways) return why;
    const wider = ways.widerRadius;
    const who = wider
      ? this.t('discover.soldOut.who', { style: this.style(), count: wider.count })
      : '';
    const next = ways.nearbyDates.length
      ? wider
        ? this.t('discover.soldOut.nextBoth', { who, radius: wider.km })
        : this.t('discover.soldOut.nextDates')
      : wider
        ? this.t('discover.soldOut.nextRadius', { who, radius: wider.km })
        : this.t('discover.soldOut.nextNone');
    return `${why} ${next}`;
  });

  protected readonly datesHeading = computed(() =>
    this.t('discover.soldOut.datesHeading', { style: this.style() }),
  );

  protected readonly nearbyDates = computed(() =>
    (this.store.alternatives()?.nearbyDates ?? []).map((nearby) => ({
      value: nearby.date,
      date: this.format.shortDate(nearby.date),
      detail: this.t('discover.soldOut.dateCount', { style: this.style(), count: nearby.count }),
    })),
  );

  protected readonly wider = computed(() => {
    const wider = this.store.alternatives()?.widerRadius;
    return wider
      ? {
          km: wider.km,
          label: this.t('discover.soldOut.wider', { radius: wider.km, count: wider.count }),
        }
      : null;
  });

  protected pickDate(date: string): void {
    this.store.navigate({ date }, { replace: false });
  }

  protected widen(km: RadiusKm): void {
    this.store.navigate({ radius: km }, { replace: false });
  }

  protected showAllStyles(): void {
    this.store.navigate({ styles: [], under800: false }, { replace: true });
  }

  private t(key: string, params?: Record<string, unknown>): string {
    return this.transloco.translate(key, params);
  }
}
