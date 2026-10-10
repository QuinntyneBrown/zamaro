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
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import {
  addDays,
  addMonths,
  type CalendarDate,
  FeatureFlags,
  FormatService,
  GATHERING_KINDS,
  type MusicalKey,
  torontoToday,
} from 'api';
import {
  Alert,
  Artwork,
  BookingForm,
  Breadcrumb,
  Button,
  ButtonLink,
  type Crumb,
  EmptyState,
  type FieldOption,
  FormField,
  Icon,
  InlineMessage,
  Marquee,
  Rating,
  Review,
  Setlist,
  Skeleton,
  TourDates,
  type TourDate as TourDateRow,
  VideoCard,
} from 'components';
import { map } from 'rxjs';
import { LastSearch } from '../../shared/last-search';
import { ArtistProfileStore } from './artist-profile.store';
import { BookingDateStore } from './booking-date.store';
import { ProfileReviewsStore } from './profile-reviews.store';

/** Songs shown in the strip under the header (L2-012.1). */
const STRIP_SONGS = 5;

/** Reviews each "Show more" adds (L2-018.2). */
const REVIEWS_PER_PAGE = 10;

/**
 * An artist's public profile at `/artists/{slug}` (docs/mocks/pages/artist): the header, the strip
 * of songs, About, videos, photos, the setlist, the upcoming dates, what churches say, and the
 * booking stub. A `?date=` carried from Discover names the date on the back link and starts the
 * dates and the stub there (L2-012.2, L2-017). Sending the request waits behind the
 * `bookingRequests` flag (M5).
 */
@Component({
  selector: 'zm-artist-page',
  imports: [
    Alert,
    Artwork,
    BookingForm,
    Breadcrumb,
    Button,
    ButtonLink,
    EmptyState,
    FormField,
    Icon,
    InlineMessage,
    Marquee,
    Rating,
    ReactiveFormsModule,
    Review,
    RouterLink,
    Setlist,
    Skeleton,
    TourDates,
    TranslocoPipe,
    VideoCard,
  ],
  providers: [ArtistProfileStore, ProfileReviewsStore, BookingDateStore],
  host: { '[attr.aria-busy]': "store.showSkeletons() ? 'true' : null" },
  templateUrl: './artist.html',
  styleUrl: './artist.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArtistPage {
  protected readonly store = inject(ArtistProfileStore);
  protected readonly reviewsStore = inject(ProfileReviewsStore);
  protected readonly dates = inject(BookingDateStore);
  protected readonly flags = inject(FeatureFlags);
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

  /** The booking stub's fields; the page owns the form (booking-form CRD D-3). */
  protected readonly request = new FormGroup({
    date: new FormControl('', { nonNullable: true }),
    kind: new FormControl<string>('sunday-service', { nonNullable: true }),
    church: new FormControl('', { nonNullable: true }),
    message: new FormControl('', { nonNullable: true }),
  });

  protected readonly kinds: FieldOption[] = GATHERING_KINDS.map((kind) => ({
    value: kind,
    label: this.t(`discover.kind.${kind}`),
  }));

  /** The booking window: 3 days to 18 months ahead (L2-004). */
  protected readonly minDate = addDays(torontoToday(), 3);
  protected readonly maxDate = addMonths(torontoToday(), 18);

  constructor() {
    this.route.paramMap
      .pipe(
        map((params) => params.get('slug') ?? ''),
        takeUntilDestroyed(),
      )
      .subscribe((slug) => {
        const date = this.date();
        const search = this.lastSearch.search();
        this.store.load(slug);
        this.dates.load(slug, date);
        this.request.reset({
          date: date ?? '',
          kind: search && search.date === date ? search.params['kind'] : 'sunday-service',
        });
      });
    this.request.controls.date.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((date) => this.dates.select(date));
  }

  /** The stub's date: carried from Discover, picked or typed (L2-017.3). */
  private readonly shortDate = computed(() => {
    const date = this.dates.selectedDate();
    return date ? this.format.shortDate(date) : null;
  });

  /** Back to the last lineup, or to Discover with the carried date (L2-009.2, L2-107). */
  protected readonly lineupParams = computed(() => {
    const date = this.date();
    return this.lastSearch.search()?.params ?? (date ? { date } : {});
  });

  private readonly back = computed<Crumb>(() => {
    const carried = this.date();
    const date = carried ? this.format.shortDate(carried) : null;
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

  /** "Upcoming dates" as the list shows them; the stub's date is "Your date" (L2-017). */
  protected readonly tourRows = computed<TourDateRow[]>(() => {
    const selected = this.dates.selectedDate();
    return this.dates.tourDates().map((row) => {
      const stamp = this.format.dayStamp(row.date);
      const current = row.date === selected;
      const booking =
        row.status === 'booked'
          ? { kind: this.t(`discover.kind.${row.kind}`), city: row.city }
          : null;
      return {
        id: row.date,
        dayLabel: stamp.weekday,
        dayValue: stamp.day,
        current,
        status: row.status,
        note: booking
          ? this.t(current ? 'artist.dates.yourDateBooked' : 'artist.dates.booking', booking)
          : this.t(current ? 'artist.dates.yourDate' : 'artist.dates.openAllDay'),
        pickLabel: this.t('artist.dates.pickLabel', { date: this.format.shortDate(row.date) }),
      };
    });
  });

  /** "Pick a free date…" beside a list with bookings in it; a wide-open calendar says so. */
  protected readonly datesNote = computed(() => {
    const rows = this.dates.tourDates();
    if (!rows.length || rows.some((row) => row.status === 'booked')) {
      return this.t('artist.dates.note');
    }
    const month = Number(rows[0].date.slice(5, 7));
    const season =
      month >= 3 && month <= 5
        ? 'spring'
        : month >= 6 && month <= 8
          ? 'summer'
          : month >= 9 && month <= 11
            ? 'autumn'
            : 'winter';
    return this.t('artist.dates.wideOpen', { name: this.store.profile()!.firstName, season });
  });

  protected readonly stubPrice = computed(() =>
    this.t('artist.stub.price', {
      price: this.format.money(this.store.profile()!.fromPrice.cents),
    }),
  );

  /** "Abigail is free Sat 14 Nov" under the date, once the date is known to be free (L2-019.2). */
  protected readonly dateFree = computed(() =>
    this.dates.status() === 'free'
      ? this.t('artist.stub.free', {
          name: this.store.profile()!.firstName,
          date: this.shortDate(),
        })
      : null,
  );

  /** The date field's error: the date is taken, or outside the booking window (L2-019.3). */
  protected readonly dateError = computed(() => {
    switch (this.dates.status()) {
      case 'booked':
        return this.t('artist.stub.booked', {
          name: this.store.profile()!.firstName,
          date: this.shortDate(),
        });
      case 'refused':
        return this.dates.refusal();
      default:
        return null;
    }
  });

  protected readonly submitLabel = computed(() => {
    const date = this.shortDate();
    return date ? this.t('artist.stub.submitForDate', { date }) : this.t('artist.stub.submit');
  });

  /** Moves focus to the booking stub's date field, scrolling the stub into view (L2-012.3, L2-019.5). */
  protected book(): void {
    this.document.getElementById('book-date')?.focus();
  }

  /** A free row's date moves into the stub and the Book button; focus follows it there (L2-017.3). */
  protected pick(date: CalendarDate): void {
    this.request.controls.date.setValue(date);
    afterNextRender(() => this.book(), { injector: this.injector });
  }

  /** Opens the stub with the message written for them (L2-020.1). */
  protected askForRecording(): void {
    this.request.controls.message.setValue(this.t('artist.stub.recording'));
    this.document.getElementById('book-message')?.focus();
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
