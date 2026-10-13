import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import {
  ADMIN_ARTISTS_API,
  ADMIN_OVERVIEW_API,
  type AdminArtistList,
  type AdminArtistRow,
} from 'api';
import {
  Alert,
  Badge,
  Button,
  ButtonLink,
  EmptyState,
  FormField,
  Icon,
  Rating,
  Skeleton,
  Table,
  type TableColumn,
  TableCell,
} from 'components';
import { map } from 'rxjs';
import { PageTitle } from '../../shared/page-title';

type Status = 'loading' | 'loaded' | 'error';

/**
 * The Artists list at `/admin/artists` (docs/mocks/pages/admin-artists, suspend-and-reinstate-artists,
 * L2-067): every approved and suspended artist A to Z with the counts, a search by name, city or
 * email (`?q=`), and the way into the Vulnerable Sector Check queue with its count. Read only until
 * suspend and reinstate (M8, D18).
 */
@Component({
  selector: 'zm-artists-page',
  imports: [
    Alert,
    Badge,
    Button,
    ButtonLink,
    EmptyState,
    FormField,
    Icon,
    Rating,
    ReactiveFormsModule,
    RouterLink,
    Skeleton,
    Table,
    TableCell,
    TranslocoPipe,
  ],
  host: { '[attr.aria-busy]': "status() === 'loading' ? 'true' : null" },
  templateUrl: './artists.html',
  styleUrl: './artists.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArtistsPage {
  private readonly api = inject(ADMIN_ARTISTS_API);
  private readonly overviewApi = inject(ADMIN_OVERVIEW_API);
  private readonly transloco = inject(TranslocoService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  /** The search in the address: `/artists?q=Tobi`. */
  private readonly query = toSignal(
    inject(ActivatedRoute).queryParamMap.pipe(map((params) => params.get('q') ?? '')),
    { initialValue: '' },
  );

  protected readonly form = inject(NonNullableFormBuilder).group({ q: '' });
  protected readonly status = signal<Status>('loading');
  protected readonly list = signal<AdminArtistList | null>(null);
  /** The query the shown rows answer. */
  protected readonly applied = signal('');
  protected readonly checksWaiting = signal<number | null>(null);

  protected readonly columns: TableColumn[] = [
    {
      key: 'artist',
      header: this.transloco.translate('admin.artists.columns.artist'),
      skeleton: 'long',
    },
    {
      key: 'act',
      header: this.transloco.translate('admin.artists.columns.act'),
      skeleton: 'short',
    },
    { key: 'city', header: this.transloco.translate('admin.artists.columns.city') },
    {
      key: 'rating',
      header: this.transloco.translate('admin.artists.columns.rating'),
      skeleton: 'short',
    },
    { key: 'status', header: this.transloco.translate('admin.artists.columns.status') },
    {
      key: 'actions',
      header: this.transloco.translate('admin.artists.columns.actions'),
      headerHidden: true,
      actions: true,
      skeleton: 'control',
    },
  ];

  protected readonly artists = computed(() => this.list()?.artists ?? []);

  /** "43 artists · 42 approved · 1 suspended": every artist, whatever the search. */
  protected readonly subtitle = computed(() => {
    const list = this.list();
    return list
      ? this.transloco.translate('admin.artists.subtitle', {
          total: list.total,
          approved: list.approved,
          suspended: list.suspended,
        })
      : '';
  });

  protected readonly caption = computed(() =>
    this.applied()
      ? this.transloco.translate('admin.artists.caption.matching', { query: this.applied() })
      : this.transloco.translate('admin.artists.caption.all'),
  );

  constructor() {
    inject(PageTitle).set('admin.artists.title');
    inject(ActivatedRoute)
      .queryParamMap.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.form.setValue({ q: this.query() });
        this.load();
      });
    this.overviewApi
      .overview()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (overview) => this.checksWaiting.set(overview.checksWaiting),
        error: () => undefined,
      });
  }

  /** The search goes into the address, which loads the list. */
  protected submit(): void {
    const q = this.form.getRawValue().q.trim();
    void this.router.navigate([], { queryParams: q ? { q } : {} });
  }

  protected clearSearch(): void {
    this.form.setValue({ q: '' });
    this.submit();
  }

  protected retry(): void {
    this.load();
  }

  protected city(artist: AdminArtistRow): string {
    return this.transloco.translate('admin.cityProvince', { city: artist.baseCity });
  }

  protected ratingLabel(artist: AdminArtistRow): string {
    return this.transloco.translate('admin.rating', { rating: artist.rating?.toFixed(1) ?? '' });
  }

  protected statusVariant(artist: AdminArtistRow): 'success' | 'danger' {
    return artist.status === 'approved' ? 'success' : 'danger';
  }

  private load(): void {
    const query = this.query();
    this.applied.set(query);
    this.status.set('loading');
    this.api
      .list(query)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (list) => {
          this.list.set(list);
          this.status.set('loaded');
        },
        error: () => this.status.set('error'),
      });
  }
}
