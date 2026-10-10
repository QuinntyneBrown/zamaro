import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, PLATFORM_ID } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { FormatService } from 'api';
import { Marquee, Poster } from 'components';
import { Lineup } from './lineup/lineup';
import { QUICK_PICK_CITIES, SearchForm } from './search-form/search-form';
import { fromParams } from './search-query-codec';
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
    @if (store.status() !== 'idle') {
      <zm-lineup />
    }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Discover {
  protected readonly store = inject(SearchStore);
  private readonly format = inject(FormatService);
  private readonly transloco = inject(TranslocoService);

  protected readonly cities = QUICK_PICK_CITIES;

  /**
   * The address bar drives the search (L2-009). The server fills the form from it; the browser
   * also runs the search, so a shared link counts once against the rate limit and is never cached.
   */
  constructor() {
    const browser = isPlatformBrowser(inject(PLATFORM_ID));
    inject(ActivatedRoute)
      .queryParamMap.pipe(takeUntilDestroyed())
      .subscribe((params) => this.store.load(fromParams(params), browser));
  }

  protected readonly posterDate = computed(() => {
    const query = this.store.query();
    return query ? this.format.shortDate(query.date) : this.t('discover.poster.noDate');
  });

  protected readonly subtitle = computed(() => {
    const query = this.store.query();
    const result = this.store.result();
    if (this.store.status() === 'loading') {
      return this.t('discover.poster.checking', { place: this.store.placeName() });
    }
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
