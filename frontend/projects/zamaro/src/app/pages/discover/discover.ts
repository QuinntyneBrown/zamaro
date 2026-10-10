import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { FormatService } from 'api';
import { Marquee, Poster } from 'components';
import { Lineup } from './lineup/lineup';
import { QUICK_PICK_CITIES, SearchForm } from './search-form/search-form';
import { SearchStore } from './search.store';

/** Discover at `/` (docs/mocks/pages/discover): the poster with the search form, then the lineup. */
@Component({
  selector: 'zm-discover',
  imports: [Lineup, Marquee, Poster, SearchForm],
  providers: [SearchStore],
  template: `<zm-poster
      [kicker]="t('discover.poster.kicker')"
      [heading]="t('discover.poster.title')"
      [date]="posterDate()"
      [subtitle]="subtitle()"
    >
      <zm-search-form />
    </zm-poster>
    <zm-marquee [items]="cities" />
    @if (store.status() === 'loaded') {
      <zm-lineup [query]="store.query()!" [result]="store.result()!" />
    }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Discover {
  protected readonly store = inject(SearchStore);
  private readonly format = inject(FormatService);
  private readonly transloco = inject(TranslocoService);

  protected readonly cities = QUICK_PICK_CITIES;

  protected readonly posterDate = computed(() => {
    const query = this.store.query();
    return query ? this.format.shortDate(query.date) : this.t('discover.poster.noDate');
  });

  protected readonly subtitle = computed(() => {
    const query = this.store.query();
    const result = this.store.result();
    if (!query || !result || this.store.status() !== 'loaded') {
      return this.t('discover.poster.intro');
    }
    return this.t('discover.poster.found', {
      count: result.total,
      weekday: this.format.weekday(query.date),
      place: this.store.placeName(),
    });
  });

  protected t(key: string, params?: Record<string, unknown>): string {
    return this.transloco.translate(key, params);
  }
}
