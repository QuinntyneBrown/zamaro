import { DOCUMENT } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { type CalendarDate, FormatService, type MusicalKey } from 'api';
import {
  Alert,
  Artwork,
  Breadcrumb,
  Button,
  ButtonLink,
  type Crumb,
  EmptyState,
  Icon,
  Marquee,
  Rating,
  Review,
  Setlist,
  Skeleton,
  VideoCard,
} from 'components';
import { map } from 'rxjs';
import { LastSearch } from '../../shared/last-search';
import { ArtistProfileStore } from './artist-profile.store';
import { ProfileReviewsStore } from './profile-reviews.store';

/** Songs shown in the strip under the header (L2-012.1). */
const STRIP_SONGS = 5;

/** Reviews each "Show more" adds (L2-018.2). */
const REVIEWS_PER_PAGE = 10;

/**
 * An artist's public profile at `/artists/{slug}` (docs/mocks/pages/artist): the header, the strip
 * of songs, About, videos, photos, the setlist and what churches say. A `?date=` carried from
 * Discover names the date on the back link and the Book button (L2-012.2). The booking stub joins
 * later.
 */
@Component({
  selector: 'zm-artist-page',
  imports: [
    Alert,
    Artwork,
    Breadcrumb,
    Button,
    ButtonLink,
    EmptyState,
    Icon,
    Marquee,
    Rating,
    Review,
    Setlist,
    Skeleton,
    TranslocoPipe,
    VideoCard,
  ],
  providers: [ArtistProfileStore, ProfileReviewsStore],
  host: { '[attr.aria-busy]': "store.showSkeletons() ? 'true' : null" },
  templateUrl: './artist.html',
  styleUrl: './artist.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArtistPage {
  protected readonly store = inject(ArtistProfileStore);
  protected readonly reviewsStore = inject(ProfileReviewsStore);
  private readonly lastSearch = inject(LastSearch);
  private readonly format = inject(FormatService);
  private readonly transloco = inject(TranslocoService);
  private readonly document = inject(DOCUMENT);
  private readonly route = inject(ActivatedRoute);
  private readonly injector = inject(Injector);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

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

  protected readonly ratingLabel = computed(() => {
    const profile = this.store.profile()!;
    return this.t('common.rating.label', {
      rating: profile.rating?.toFixed(1),
      count: profile.reviewCount,
    });
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

  /** The act-type illustration: a singer for a solo act, a group for the rest (L2-020.3). */
  protected readonly artVariant = computed(() =>
    this.store.profile()!.actType === 'solo' ? 'solo' : 'group',
  );

  protected readonly videos = computed(() =>
    this.store.profile()!.videos.map((video) => {
      const minutes = Math.floor(video.durationSeconds / 60);
      const seconds = video.durationSeconds % 60;
      return {
        id: video.id,
        title: video.title,
        stamp: this.t('artist.videos.stamp', {
          duration: `${minutes}:${String(seconds).padStart(2, '0')}`,
        }),
        // "Play Way Maker, live at Bethel Pentecostal, Hamilton, 6 minutes 12 seconds".
        label: this.t('artist.videos.label', {
          title: video.title.replace(' — ', ', '),
          minutes,
          seconds,
        }),
        poster: video.poster,
        stream: video.stream,
        captions: video.captions && {
          src: video.captions.src,
          srclang: video.captions.lang,
          label: this.t('artist.videos.captions', { lang: video.captions.lang }),
        },
      };
    }),
  );

  protected readonly photos = computed(() => {
    const photos = this.store.profile()!.photos;
    return photos.map((photo, index) => ({
      id: photo.id,
      openLabel: this.t('artist.photos.open', {
        position: index + 1,
        total: photos.length,
        alt: photo.alt,
      }),
      image: { ...photo, sizes: '(min-width: 48rem) 25vw, 50vw' },
    }));
  });

  protected readonly noPhotosLabel = computed(() => {
    const profile = this.store.profile()!;
    return this.t('artist.photos.none', { act: profile.actType, name: profile.displayName });
  });

  protected readonly songs = computed(() =>
    this.store.profile()!.setlist.map((song) => ({
      title: song.title,
      credit: song.writer,
      key: this.keyLabel(song.key),
    })),
  );

  protected readonly ratingCount = computed(() =>
    this.t('common.rating.churches', { count: this.store.profile()!.reviewCount }),
  );

  /** Each review as the card shows it, with the month and reply line formatted (L2-110). */
  protected readonly reviews = computed(() =>
    this.reviewsStore.reviews().map((review) => ({
      id: review.id,
      quote: review.text,
      stars: review.stars,
      starsLabel: this.t('artist.reviews.stars', { n: review.stars }),
      reviewer: review.attribution.reviewerName,
      source: this.t('artist.reviews.source', {
        church: review.attribution.churchName,
        city: review.attribution.city,
        month: this.format.monthYear(review.attribution.month),
      }),
      reply: review.reply?.text ?? null,
      replyMeta: review.reply
        ? this.t('artist.reviews.replyMeta', {
            name: review.reply.artistName,
            month: this.format.monthYear(review.reply.month),
          })
        : '',
    })),
  );

  /** "Show all 38 reviews" from the profile's first few, then "Show 10 more" (or fewer at the end). */
  protected readonly moreReviewsLabel = computed(() => {
    const shown = this.reviews().length;
    const total = this.reviewsStore.total();
    return shown <= this.store.profile()!.reviews.items.length
      ? this.t('artist.reviews.showAll', { count: total })
      : this.t('artist.reviews.more', { count: Math.min(REVIEWS_PER_PAGE, total - shown) });
  });

  /** Appends the next reviews and moves focus to the first new one (L2-018.2, L2-101). */
  protected async showMoreReviews(): Promise<void> {
    const firstNew = this.reviews().length;
    if (!(await this.reviewsStore.loadMore())) return;
    afterNextRender(
      () =>
        this.host.nativeElement.querySelectorAll<HTMLElement>('.reviews > li')[firstNew]?.focus(),
      { injector: this.injector },
    );
  }

  /** The viewer loads on first use; it returns focus to the photo that opened it (L2-015.2). */
  protected async openPhoto(index: number): Promise<void> {
    const profile = this.store.profile()!;
    const { openPhotoViewer } = await import('../../dialogs/photo-viewer/photo-viewer');
    openPhotoViewer(this.injector, {
      artistName: profile.displayName,
      photos: profile.photos,
      start: index,
    });
  }

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
