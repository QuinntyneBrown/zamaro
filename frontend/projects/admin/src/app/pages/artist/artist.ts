import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import {
  ADMIN_ARTISTS_API,
  type AdminArtistDetail,
  type AdminUpcomingBooking,
  type CalendarDate,
  FormatService,
} from 'api';
import {
  Alert,
  Badge,
  Breadcrumb,
  Button,
  ButtonLink,
  type Crumb,
  type DescriptionItem,
  DescriptionList,
  Icon,
  Rating,
  Skeleton,
  Stamp,
  type TourDate,
  TourDates,
  TourDateTrail,
} from 'components';
import { map } from 'rxjs';
import { PageTitle } from '../../shared/page-title';

type Status = 'loading' | 'loaded' | 'error';

/** An upcoming booking as a schedule row, with its status for the stamp. */
interface BookingRow extends TourDate {
  bookingStatus: AdminUpcomingBooking['status'];
}

/**
 * One artist as the administrator sees them, at `/admin/artists/{id}` (docs/mocks/pages/admin-artist,
 * suspend-and-reinstate-artists, L2-067): the account and profile details, the bookings still to
 * come, the suspension history and the standing. Suspend and reinstate come with M8 (D18), so the
 * standing is read only.
 */
@Component({
  selector: 'zm-artist-page',
  imports: [
    Alert,
    Badge,
    Breadcrumb,
    Button,
    ButtonLink,
    DescriptionList,
    Icon,
    Rating,
    Skeleton,
    Stamp,
    TourDates,
    TourDateTrail,
    TranslocoPipe,
  ],
  host: { '[attr.aria-busy]': "status() === 'loading' ? 'true' : null" },
  templateUrl: './artist.html',
  styleUrl: './artist.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArtistPage {
  private readonly api = inject(ADMIN_ARTISTS_API);
  private readonly transloco = inject(TranslocoService);
  private readonly format = inject(FormatService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly pageTitle = inject(PageTitle);

  private readonly id = toSignal(
    inject(ActivatedRoute).paramMap.pipe(map((params) => Number(params.get('id')))),
    { initialValue: 0 },
  );

  protected readonly status = signal<Status>('loading');
  protected readonly artist = signal<AdminArtistDetail | null>(null);

  protected readonly crumbs = computed<Crumb[]>(() => [
    { label: this.transloco.translate('admin.nav.artists'), link: '/artists' },
    {
      label:
        this.artist()?.name ??
        (this.status() === 'loading'
          ? this.transloco.translate('admin.artist.loading.crumb')
          : this.transloco.translate('admin.artist.loading.title')),
    },
  ]);

  /** "Artist · approved Mon 2 Mar 2026". */
  protected readonly overline = computed(() => {
    const artist = this.artist();
    if (!artist) return this.transloco.translate('admin.artist.loading.overline');
    return artist.approvedAt
      ? this.transloco.translate('admin.artist.overline', {
          date: this.format.shortDateWithYear(artist.approvedAt.slice(0, 10) as CalendarDate),
        })
      : this.transloco.translate('admin.artist.overlineNoDate');
  });

  /** "Band · Acoustic, Hymns · Hamilton, ON": the act, then the styles that add to it. */
  protected readonly subtitle = computed(() => {
    const artist = this.artist();
    if (!artist) return '';
    const act = this.transloco.translate(`common.act.${artist.actType}`);
    const city = this.transloco.translate('admin.cityProvince', { city: artist.baseCity });
    const styles = artist.styles
      .filter((style) => style !== artist.actType)
      .map((style) => this.transloco.translate(`common.style.${style}`))
      .join(', ');
    return styles
      ? this.transloco.translate('admin.artist.subtitle', { act, styles, city })
      : this.transloco.translate('admin.artist.subtitleNoStyles', { act, city });
  });

  protected readonly statusVariant = computed<'success' | 'danger'>(() =>
    this.artist()?.status === 'suspended' ? 'danger' : 'success',
  );

  /** Every detail but the rating, which renders as a labelled image. */
  protected readonly details = computed<DescriptionItem[]>(() => {
    const artist = this.artist();
    if (!artist) return [];
    const t = (key: string, params?: Record<string, unknown>) =>
      this.transloco.translate(`admin.artist.details.${key}`, params);
    return [
      { id: 'email', term: t('email'), value: artist.email },
      {
        id: 'act',
        term: t('act'),
        value: this.transloco.translate(`common.act.${artist.actType}`),
      },
      {
        id: 'city',
        term: t('city'),
        value: this.transloco.translate('admin.cityProvince', { city: artist.baseCity }),
      },
      {
        id: 'price',
        term: t('price'),
        value: t('priceValue', { price: this.format.money(artist.fromPriceCents) }),
      },
    ];
  });

  protected readonly address = computed(() => {
    const artist = this.artist();
    if (!artist) return '';
    return this.transloco.translate(
      artist.status === 'suspended'
        ? 'admin.artist.details.addressSuspended'
        : 'admin.artist.details.addressValue',
      { slug: artist.slug },
    );
  });

  protected readonly ratingLabel = computed(() =>
    this.transloco.translate('admin.rating', {
      rating: this.artist()?.rating?.toFixed(1) ?? '',
    }),
  );

  protected readonly bookings = computed<BookingRow[]>(() =>
    (this.artist()?.upcomingBookings ?? []).map((booking) => {
      const stamp = this.format.dayStamp(booking.eventDate);
      return {
        id: booking.number,
        dayLabel: stamp.weekday,
        dayValue: stamp.day,
        title: this.transloco.translate('admin.artist.bookings.row', {
          number: booking.number,
          church: booking.churchName,
        }),
        note: this.transloco.translate('admin.artist.bookings.note', {
          city: booking.churchCity,
          kind: this.transloco.translate(`discover.kind.${booking.kind}`),
        }),
        bookingStatus: booking.status,
      };
    }),
  );

  protected readonly suspensions = computed<DescriptionItem[]>(() =>
    (this.artist()?.suspensions ?? []).map((suspension, index) => ({
      id: String(index),
      term: this.transloco.translate('admin.artist.history.entry', {
        date: this.format.shortDateWithYear(suspension.suspendedAt.slice(0, 10) as CalendarDate),
      }),
      value: suspension.reason,
    })),
  );

  constructor() {
    this.pageTitle.set('admin.artist.loading.title');
    inject(ActivatedRoute)
      .paramMap.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.load());
  }

  protected retry(): void {
    this.load();
  }

  private load(): void {
    this.status.set('loading');
    this.artist.set(null);
    this.api
      .artist(this.id())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (artist) => {
          this.artist.set(artist);
          this.status.set('loaded');
          this.pageTitle.setText(artist.name);
        },
        error: () => this.status.set('error'),
      });
  }
}
