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
  ADMIN_VULNERABLE_SECTOR_CHECKS_API,
  type AdminVulnerableSectorCheck,
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
  EmptyState,
  Icon,
  Skeleton,
  Table,
  type TableColumn,
  TableCell,
  ToastService,
} from 'components';
import { PageTitle } from '../../shared/page-title';
import { VscDocumentLink } from '../../shell/vsc-document-link';

type Status = 'loading' | 'loaded' | 'error';

/**
 * The Vulnerable Sector Check queue at `/admin/vulnerable-sector-checks` (docs/mocks/pages/admin-checks,
 * verify-vulnerable-sector-check, L2-049.2): the checks waiting, oldest upload first, each with View
 * document and Verify. A verified row stays on the page, with its expiry and who verified it, until
 * the page is opened again.
 */
@Component({
  selector: 'zm-checks-page',
  imports: [
    Alert,
    Badge,
    Breadcrumb,
    Button,
    ButtonLink,
    EmptyState,
    Icon,
    RouterLink,
    Skeleton,
    Table,
    TableCell,
    TranslocoPipe,
    VscDocumentLink,
  ],
  host: { '[attr.aria-busy]': "status() === 'loading' ? 'true' : null" },
  templateUrl: './checks.html',
  styleUrl: './checks.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChecksPage {
  private readonly api = inject(ADMIN_VULNERABLE_SECTOR_CHECKS_API);
  private readonly transloco = inject(TranslocoService);
  private readonly format = inject(FormatService);
  private readonly toasts = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly status = signal<Status>('loading');
  protected readonly checks = signal<AdminVulnerableSectorCheck[]>([]);
  /** The check whose Verify is on its way. */
  protected readonly verifying = signal<number | null>(null);

  protected readonly crumbs: Crumb[] = [
    { label: this.transloco.translate('admin.nav.artists'), link: '/artists' },
    { label: this.transloco.translate('admin.checks.title') },
  ];

  protected readonly columns: TableColumn[] = [
    {
      key: 'artist',
      header: this.transloco.translate('admin.checks.columns.artist'),
      skeleton: 'long',
    },
    { key: 'issued', header: this.transloco.translate('admin.checks.columns.issued') },
    { key: 'uploaded', header: this.transloco.translate('admin.checks.columns.uploaded') },
    {
      key: 'check',
      header: this.transloco.translate('admin.checks.columns.check'),
      skeleton: 'long',
    },
    {
      key: 'actions',
      header: this.transloco.translate('admin.checks.columns.actions'),
      headerHidden: true,
      actions: true,
      skeleton: 'control',
    },
  ];

  protected readonly waiting = computed(
    () => this.checks().filter((check) => check.status === 'pending').length,
  );

  /** "2 waiting · a verified check counts…", "Nothing waiting", or the rule alone while failing. */
  protected readonly subtitle = computed(() => {
    if (this.status() === 'error') return this.transloco.translate('admin.checks.rule');
    return this.waiting() === 0
      ? this.transloco.translate('admin.checks.nothingWaiting')
      : this.transloco.translate('admin.checks.subtitle', { waiting: this.waiting() });
  });

  /** Once a row is verified the table is no longer only the queue: "Checks uploaded since Wed 7 Oct". */
  protected readonly caption = computed(() => {
    const checks = this.checks();
    if (!checks.some((check) => check.status !== 'pending') || checks.length === 0) {
      return this.transloco.translate('admin.checks.caption.waiting');
    }
    const oldest = checks.reduce((first, check) =>
      check.uploadedAt < first.uploadedAt ? check : first,
    );
    return this.transloco.translate('admin.checks.caption.since', {
      date: this.format.shortDate(oldest.uploadedAt.slice(0, 10) as CalendarDate),
    });
  });

  constructor() {
    inject(PageTitle).set('admin.checks.title');
    this.load();
  }

  protected retry(): void {
    this.load();
  }

  protected issued(check: AdminVulnerableSectorCheck): string {
    return this.format.shortDateWithYear(check.issuedOn);
  }

  /** "Wed 7 Oct, 4:10 p.m." */
  protected uploaded(check: AdminVulnerableSectorCheck): string {
    return this.transloco.translate('admin.checks.uploadedAt', {
      date: this.format.shortDate(check.uploadedAt.slice(0, 10) as CalendarDate),
      time: this.format.time(check.uploadedAt),
    });
  }

  /** "First check" or "Replaces the check verified until Fri 3 Mar 2028". */
  protected replaces(check: AdminVulnerableSectorCheck): string {
    return check.replaces
      ? this.transloco.translate('admin.checks.replaces', {
          date: this.format.shortDateWithYear(check.replaces.verifiedUntil),
        })
      : this.transloco.translate('admin.checks.firstCheck');
  }

  /** "until Tue 25 Sep 2029 · by Priya Nair", after the Verified badge. */
  protected verifiedUntil(check: AdminVulnerableSectorCheck): string {
    return this.transloco.translate('admin.checks.verifiedUntil', {
      date: check.expiresOn ? this.format.shortDateWithYear(check.expiresOn) : '',
      name: check.verifiedBy?.name ?? '',
    });
  }

  protected verify(check: AdminVulnerableSectorCheck): void {
    if (this.verifying() !== null) return;
    this.verifying.set(check.id);
    this.api
      .verify(check.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (verified) => {
          this.verifying.set(null);
          this.checks.update((checks) =>
            checks.map((row) => (row.id === verified.id ? verified : row)),
          );
        },
        error: (failure: { error?: { detail?: string; errors?: Record<string, string[]> } }) => {
          this.verifying.set(null);
          const title = this.transloco.translate('admin.checks.verifyFailed', {
            name: check.artist.name,
          });
          const problem = failure.error;
          this.toasts.show({
            variant: 'danger',
            title,
            text:
              problem?.errors?.['issuedOn']?.[0] ??
              problem?.detail ??
              this.transloco.translate('admin.checks.verifyFailedText'),
            dismissLabel: this.transloco.translate('common.toast.dismiss', { title }),
          });
        },
      });
  }

  private load(): void {
    this.status.set('loading');
    this.api
      .queue()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (queue) => {
          this.checks.set(queue.checks);
          this.status.set('loaded');
        },
        error: () => this.status.set('error'),
      });
  }
}
