import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  PLATFORM_ID,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { AuthService, FormatService } from 'api';
import { Band, Marquee, Poster } from 'components';
import { HowBookingWorks } from './how-booking-works/how-booking-works';
import { Lineup } from './lineup/lineup';
import { QUICK_PICK_CITIES, SearchForm } from './search-form/search-form';
import { PageMeta } from '../../shared/page-meta';
import { fromParams } from './search-query-codec';
import { SearchStore } from './search.store';

/**
 * Discover at `/` (docs/mocks/pages/discover): the poster with the search form, the lineup, then
 * "How booking works" and the call to artists. "Apply as an artist" joins the band with the
 * application (M3).
 */
@Component({
  selector: 'zm-discover',
  imports: [Band, HowBookingWorks, Lineup, Marquee, Poster, SearchForm, TranslocoPipe],
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
    }
    <zm-how-booking-works />
    <section id="join" class="section" aria-labelledby="join-title">
      <div class="container">
        <zm-band
          headingId="join-title"
          [kicker]="'discover.join.kicker' | transloco"
          [title]="'discover.join.title' | transloco"
        >
          <p>{{ 'discover.join.body' | transloco }}</p>
        </zm-band>
      </div>
    </section>`,
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
   * Back to the last lineup shows it again without searching (L2-009.2); any other way here
   * searches afresh.
   */
  constructor() {
    inject(PageMeta).set({
      title: this.t('discover.meta.title'),
      description: this.t('discover.meta.description'),
      path: '/',
    });
    const browser = isPlatformBrowser(inject(PLATFORM_ID));
    const router = inject(Router);
    inject(ActivatedRoute)
      .queryParamMap.pipe(takeUntilDestroyed())
      .subscribe((params) => {
        const state = fromParams(params);
        const back = router.currentNavigation()?.trigger === 'popstate';
        if (!(browser && back && this.store.restore(state))) this.store.load(state, browser);
      });
    // A booker with a saved church starts from it (L2-004.1), unless the address names a place.
    const auth = inject(AuthService);
    effect(() => {
      const church = auth.currentUser()?.church;
      if (!church) return;
      untracked(() => {
        const state = this.store.state();
        if (state.place || state.lat !== null) return;
        this.store.state.set({
          ...state,
          place: church.city,
          lat: church.latitude,
          lng: church.longitude,
        });
      });
    });
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
