import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { type CalendarDate, FormatService, type MusicalKey } from 'api';
import {
  Alert,
  ArtistPoster,
  Breadcrumb,
  Button,
  ButtonLink,
  type Crumb,
  Icon,
  Marquee,
  type PosterFact,
  type PosterScore,
  Setlist,
  Skeleton,
} from 'components';
import { map } from 'rxjs';
import { LastSearch } from '../../shared/last-search';
import { ArtistProfileStore } from './artist-profile.store';

/** Songs shown in the strip under the header (L2-012.1). */
const STRIP_SONGS = 5;

/**
 * An artist's public profile at `/artists/{slug}` (docs/mocks/pages/artist): the header, the strip
 * of songs, About and the setlist. A `?date=` carried from Discover names the date on the back
 * link and the Book button (L2-012.2). Photos, videos, reviews and the booking stub join later.
 */
@Component({
  selector: 'zm-artist-page',
  imports: [
    Alert,
    ArtistPoster,
    Breadcrumb,
    Button,
    ButtonLink,
    Icon,
    Marquee,
    Setlist,
    Skeleton,
    TranslocoPipe,
  ],
  providers: [ArtistProfileStore],
  host: { '[attr.aria-busy]': "store.showSkeletons() ? 'true' : null" },
  templateUrl: './artist.html',
  styleUrl: './artist.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArtistPage {
  protected readonly store = inject(ArtistProfileStore);
  private readonly lastSearch = inject(LastSearch);
  private readonly format = inject(FormatService);
  private readonly transloco = inject(TranslocoService);
  private readonly document = inject(DOCUMENT);
  private readonly route = inject(ActivatedRoute);

  /** The search date carried from Discover, when it is a real date. */
  private readonly date = toSignal(
    this.route.queryParamMap.pipe(
      map((params) => {
        const date = params.get('date') ?? '';
        return /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(date))
          ? (date as CalendarDate)
          : null;
      }),
    ),
    { initialValue: null },
  );

  constructor() {
    this.route.paramMap
      .pipe(
        map((params) => params.get('slug') ?? ''),
        takeUntilDestroyed(),
      )
      .subscribe((slug) => this.store.load(slug));
  }

  private readonly shortDate = computed(() => {
    const date = this.date();
    return date ? this.format.shortDate(date) : null;
  });

  /** Back to the last lineup, or to Discover with the carried date (L2-009.2, L2-107). */
  protected readonly lineupParams = computed(() => {
    const date = this.date();
    return this.lastSearch.search()?.params ?? (date ? { date } : {});
  });

  private readonly back = computed<Crumb>(() => {
    const date = this.shortDate();
    return {
      label: date
        ? this.t('artist.breadcrumb.discoverOn', { date })
        : this.t('common.nav.discover'),
      link: '/',
      queryParams: this.lineupParams(),
    };
  });

  protected readonly crumbs = computed<Crumb[]>(() => {
    const profile = this.store.profile();
    const current =
      this.store.status() === 'error'
        ? this.t('artist.breadcrumb.artist')
        : this.store.status() === 'loaded' && profile
          ? profile.displayName
          : this.t('artist.breadcrumb.loading');
    return [this.back(), { label: current }];
  });

  /** "Headliner · …" when the artist headlined the search they came from, "New to Zamaro · …". */
  protected readonly kicker = computed(() => {
    const profile = this.store.profile()!;
    const search = this.lastSearch.search();
    const headline = profile.headline;
    if (search?.headlinerSlug === profile.slug && search.date === this.date()) {
      return this.t('artist.kicker.headliner', { headline });
    }
    return profile.reviewCount === 0 ? this.t('artist.kicker.new', { headline }) : headline;
  });

  /** "★ 4.9", read as "Rated 4.9 out of 5 by 38 churches"; "New" before the first review. */
  protected readonly score = computed<PosterScore>(() => {
    const profile = this.store.profile()!;
    if (profile.rating === null) return { text: this.t('common.rating.new') };
    return {
      text: `★ ${profile.rating.toFixed(1)}`,
      label: this.t('common.rating.label', {
        rating: profile.rating.toFixed(1),
        count: profile.reviewCount,
      }),
    };
  });

  /** "38 churches" (already in the score's label), the base city and the driving range. */
  protected readonly facts = computed<PosterFact[]>(() => {
    const profile = this.store.profile()!;
    const reviews =
      profile.rating === null
        ? { text: this.t('artist.facts.noReviews') }
        : { text: this.t('common.rating.churches', { count: profile.reviewCount }), hidden: true };
    return [
      reviews,
      { text: this.t('artist.facts.city', { city: profile.baseCity }) },
      { text: this.t('artist.facts.drives', { km: profile.maxDriveKm }) },
    ];
  });

  protected readonly bookLabel = computed(() => {
    const date = this.shortDate();
    return date ? this.t('artist.book.forDate', { date }) : this.t('artist.book.checkDates');
  });

  protected readonly strip = computed(() =>
    this.store
      .profile()!
      .setlist.slice(0, STRIP_SONGS)
      .map((song) => song.title),
  );

  protected readonly aboutHeading = computed(() => {
    const profile = this.store.profile()!;
    return profile.aboutHeading ?? this.t('artist.about.title', { name: profile.firstName });
  });

  /** The bio's paragraphs, split on blank lines; bound as text, so markup never runs (L2-013.2). */
  protected readonly paragraphs = computed(() =>
    this.store
      .profile()!
      .bio.split(/\n\s*\n/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean),
  );

  protected readonly songs = computed(() =>
    this.store.profile()!.setlist.map((song) => ({
      title: song.title,
      credit: song.writer,
      key: this.keyLabel(song.key),
    })),
  );

  /** Moves focus to the booking stub's date field (L2-012.3); the stub arrives with tour dates. */
  protected book(): void {
    this.document.getElementById('book-date')?.focus();
  }

  protected t(key: string, params?: Record<string, unknown>): string {
    return this.transloco.translate(key, params);
  }

  /** "Key of B♭", "Key of F♯ minor", "Any key". */
  private keyLabel(key: MusicalKey): string {
    if (key === 'any') return this.t('artist.setlist.anyKey');
    const minor = key.endsWith('-minor');
    const note = key.replace('-minor', '').replace('-flat', '♭').replace('-sharp', '♯');
    return this.t(minor ? 'artist.setlist.keyMinor' : 'artist.setlist.key', { note });
  }
}
