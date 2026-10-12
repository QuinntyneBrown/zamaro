import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, Injector } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { type CalendarDate, FormatService, type MusicalKey } from 'api';
import {
  ArtistPoster,
  Artwork,
  type ArtworkPhoto,
  ArtistPosterSkeleton,
  Breadcrumb,
  Button,
  ButtonLink,
  type Crumb,
  ErrorStage,
  Icon,
  Marquee,
  Setlist,
  Skeleton,
} from 'components';
import { map } from 'rxjs';
import { openPhotoViewer } from '../../dialogs/photo-viewer/photo-viewer';
import { LastSearch } from '../../shared/last-search';
import { ArtistProfileStore } from './artist-profile.store';

/** Songs shown in the strip under the header (L2-012.1). */
const STRIP_SONGS = 5;

/** The gallery's rendered width per breakpoint: 2 across, 4 from MD. */
const GALLERY_SIZES = '(min-width: 48rem) 25vw, 50vw';

/**
 * An artist's public profile at `/artists/{slug}` (docs/mocks/pages/artist): the header, the strip
 * of songs, About, the photos and the setlist. A `?date=` carried from Discover names the date on
 * the back link and the Book button (L2-012.2). Videos, reviews and the booking stub join later.
 */
@Component({
  selector: 'zm-artist-page',
  imports: [
    ArtistPoster,
    Artwork,
    ArtistPosterSkeleton,
    Breadcrumb,
    Button,
    ButtonLink,
    ErrorStage,
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
  private readonly injector = inject(Injector);

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

  /** The base city and the driving range, after the rating on the header's facts line. */
  protected readonly facts = computed(() => {
    const profile = this.store.profile()!;
    return [
      this.t('artist.facts.city', { city: profile.baseCity }),
      this.t('artist.facts.drives', { km: profile.maxDriveKm }),
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

  /** Duos, bands and choirs get the group silhouette (L2-020.3). */
  protected readonly artVariant = computed(() =>
    this.store.profile()!.actType === 'solo' ? ('solo' as const) : ('group' as const),
  );

  /** The gallery: each photo opens the viewer, and links to its largest rendition without script. */
  protected readonly photos = computed(() => {
    const photos = this.store.profile()!.photos;
    return photos.map((photo, index) => ({
      id: photo.id,
      label: this.t('artist.photos.open', {
        position: index + 1,
        total: photos.length,
        alt: photo.alt,
      }),
      full: photo.srcset.split(', ').at(-1)?.split(' ')[0] ?? photo.src,
      image: { ...photo, sizes: GALLERY_SIZES } satisfies ArtworkPhoto,
    }));
  });

  /** Opens the photo viewer at this photo (L2-015.2); a modified click still follows the link. */
  protected openPhoto(event: MouseEvent, index: number): void {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    const profile = this.store.profile()!;
    openPhotoViewer(this.injector, {
      artistName: profile.displayName,
      photos: profile.photos,
      index,
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
