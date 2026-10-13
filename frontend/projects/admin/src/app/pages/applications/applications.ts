import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import {
  ADMIN_ARTIST_APPLICATIONS_API,
  type AdminApplicationRow,
  type CalendarDate,
  FormatService,
} from 'api';
import {
  Alert,
  Button,
  ButtonLink,
  EmptyState,
  Icon,
  Skeleton,
  Table,
  type TableColumn,
  TableCell,
} from 'components';
import { PageTitle } from '../../shared/page-title';

type Status = 'loading' | 'loaded' | 'error';

/**
 * The applications queue at `/admin/applications` (docs/mocks/pages/admin-applications,
 * review-artist-application, L2-067.1): submitted applications oldest first, each with Review.
 */
@Component({
  selector: 'zm-applications-page',
  imports: [
    Alert,
    Button,
    ButtonLink,
    EmptyState,
    Icon,
    RouterLink,
    Skeleton,
    Table,
    TableCell,
    TranslocoPipe,
  ],
  host: { '[attr.aria-busy]': "status() === 'loading' ? 'true' : null" },
  templateUrl: './applications.html',
  styleUrl: './applications.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplicationsPage {
  private readonly api = inject(ADMIN_ARTIST_APPLICATIONS_API);
  private readonly transloco = inject(TranslocoService);
  private readonly format = inject(FormatService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly status = signal<Status>('loading');
  protected readonly applications = signal<AdminApplicationRow[]>([]);
  protected readonly lastDecidedAt = signal<string | null>(null);

  protected readonly columns: TableColumn[] = [
    {
      key: 'applicant',
      header: this.transloco.translate('admin.applications.columns.applicant'),
      skeleton: 'long',
    },
    {
      key: 'act',
      header: this.transloco.translate('admin.applications.columns.act'),
      skeleton: 'short',
    },
    { key: 'city', header: this.transloco.translate('admin.applications.columns.city') },
    {
      key: 'submitted',
      header: this.transloco.translate('admin.applications.columns.submitted'),
      skeleton: 'long',
    },
    {
      key: 'actions',
      header: this.transloco.translate('admin.applications.columns.actions'),
      headerHidden: true,
      actions: true,
      skeleton: 'control',
    },
  ];

  /** "3 waiting · we reply within 3 business days", "Nothing waiting", or the rule alone while failing. */
  protected readonly subtitle = computed(() => {
    if (this.status() === 'error') return this.transloco.translate('admin.applications.rule');
    const waiting = this.applications().length;
    return waiting === 0
      ? this.transloco.translate('admin.applications.nothingWaiting')
      : this.transloco.translate('admin.applications.subtitle', { waiting });
  });

  /** The empty state's body, with the last decision's date when there has been one. */
  protected readonly emptyBody = computed(() => {
    const body = this.transloco.translate('admin.applications.empty.body');
    const last = this.lastDecidedAt();
    if (!last) return body;
    const decided = this.transloco.translate('admin.applications.empty.lastDecided', {
      date: this.format.shortDate(last.slice(0, 10) as CalendarDate),
    });
    return `${body} ${decided}`;
  });

  constructor() {
    inject(PageTitle).set('admin.applications.title');
    this.load();
  }

  protected retry(): void {
    this.load();
  }

  /** "Fri 9 Oct, 10:42 a.m." */
  protected submitted(application: AdminApplicationRow): string {
    return this.transloco.translate('admin.applications.submittedAt', {
      date: this.format.shortDate(application.submittedAt.slice(0, 10) as CalendarDate),
      time: this.format.time(application.submittedAt),
    });
  }

  private load(): void {
    this.status.set('loading');
    this.api
      .queue()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (queue) => {
          this.applications.set(queue.applications);
          this.lastDecidedAt.set(queue.lastDecidedAt ?? null);
          this.status.set('loaded');
        },
        error: () => this.status.set('error'),
      });
  }
}
