import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import {
  ADMIN_AUDIT_API,
  type AuditEntry,
  type AuditFilters,
  type CalendarDate,
  FormatService,
  torontoToday,
} from 'api';
import {
  Alert,
  Badge,
  Button,
  EmptyState,
  type FieldOption,
  FormField,
  Icon,
  Table,
  type TableColumn,
  TableCell,
} from 'components';
import { PageTitle } from '../../shared/page-title';

/** Every audited action the viewer can filter by (record-audit-log). The API holds the same list. */
const ACTIONS = [
  'auth.sign_in',
  'auth.sign_in_failed',
  'auth.password_reset',
  'auth.password_changed',
  'account.email_changed',
  'auth.two_factor_enabled',
  'auth.two_factor_disabled',
  'auth.recovery_codes_replaced',
  'auth.mfa_challenge',
  'user.role_changed',
  'refund.issued',
  'payout.sent',
  'artist.suspended',
  'artist.reinstated',
  'booking.messages.viewed',
  'application.viewed',
  'application_reference.verified',
  'vsc_document.viewed',
  'vsc.verified',
  'application.approved',
  'application.rejected',
  'review.hidden',
  'review_report.dismissed',
  'booking_hold.resolved',
];

/** The default range: the eight days to today, as the mock shows (Thu 1 Oct to Fri 9 Oct). */
const DEFAULT_RANGE_DAYS = 8;

type Status = 'loading' | 'loaded' | 'error';

/**
 * The read-only audit log at `/admin/audit` (docs/mocks/pages/admin-audit, L2-069.2): filters, a
 * dense table newest first, "Show older entries" by cursor, and the no-results, loading and error
 * states. There is no edit or delete control, by design.
 */
@Component({
  selector: 'zm-audit-log-page',
  imports: [
    Alert,
    Badge,
    Button,
    EmptyState,
    FormField,
    Icon,
    ReactiveFormsModule,
    Table,
    TableCell,
    TranslocoPipe,
  ],
  templateUrl: './audit-log.html',
  styleUrl: './audit-log.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditLogPage {
  private readonly api = inject(ADMIN_AUDIT_API);
  private readonly transloco = inject(TranslocoService);
  private readonly format = inject(FormatService);
  private readonly today = torontoToday();

  protected readonly form = inject(NonNullableFormBuilder).group({
    actor: '',
    action: '',
    target: '',
    outcome: '',
    from: this.daysAgo(DEFAULT_RANGE_DAYS),
    to: this.today,
  });

  protected readonly status = signal<Status>('loading');
  protected readonly entries = signal<AuditEntry[]>([]);
  protected readonly nextCursor = signal<string | null>(null);
  protected readonly loadingOlder = signal(false);
  /** The filters the shown entries answer, for the caption. */
  private readonly applied = signal<AuditFilters>(this.form.getRawValue() as AuditFilters);

  protected readonly actionOptions: FieldOption[] = [
    { value: '', label: this.transloco.translate('admin.audit.allActions') },
    ...ACTIONS.map((action) => ({ value: action, label: action })),
  ];
  protected readonly outcomeOptions: FieldOption[] = [
    { value: '', label: this.transloco.translate('admin.audit.anyOutcome') },
    ...(['succeeded', 'failed', 'denied'] as const).map((outcome) => ({
      value: outcome,
      label: this.transloco.translate(`admin.audit.outcome.${outcome}`),
    })),
  ];
  protected readonly columns: TableColumn[] = [
    { key: 'when', header: this.transloco.translate('admin.audit.columns.when'), skeleton: 'long' },
    {
      key: 'actor',
      header: this.transloco.translate('admin.audit.columns.actor'),
      skeleton: 'long',
    },
    { key: 'action', header: this.transloco.translate('admin.audit.columns.action') },
    { key: 'target', header: this.transloco.translate('admin.audit.columns.target') },
    { key: 'address', header: this.transloco.translate('admin.audit.columns.address') },
    {
      key: 'outcome',
      header: this.transloco.translate('admin.audit.columns.outcome'),
      skeleton: 'short',
    },
  ];
  protected readonly sort = { key: 'when', direction: 'descending' } as const;

  /** "Thu 1 Oct to Fri 9 Oct 2026, newest first", from the applied range. */
  protected readonly caption = computed(() => {
    const { from, to } = this.applied();
    const end = (to || this.today) as CalendarDate;
    return this.transloco.translate('admin.audit.caption', {
      from: from ? this.format.shortDate(from as CalendarDate) : this.format.shortDate(end),
      to: this.format.shortDateWithYear(end),
    });
  });

  constructor() {
    inject(PageTitle).set('admin.audit.title');
    this.load();
  }

  protected apply(): void {
    this.load();
  }

  protected clear(): void {
    this.form.reset({
      actor: '',
      action: '',
      target: '',
      outcome: '',
      from: this.daysAgo(DEFAULT_RANGE_DAYS),
      to: this.today,
    });
    this.load();
  }

  protected retry(): void {
    this.load();
  }

  /** The next 50, appended under the ones shown. */
  protected showOlder(): void {
    const cursor = this.nextCursor();
    if (!cursor || this.loadingOlder()) return;
    this.loadingOlder.set(true);
    this.api
      .list(this.applied(), cursor)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page) => {
          this.entries.update((entries) => [...entries, ...page.entries]);
          this.nextCursor.set(page.nextCursor);
          this.loadingOlder.set(false);
        },
        error: () => this.loadingOlder.set(false),
      });
  }

  private readonly destroyRef = inject(DestroyRef);

  private load(): void {
    const filters = this.form.getRawValue() as AuditFilters;
    this.applied.set(filters);
    this.status.set('loading');
    this.api
      .list(filters)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page) => {
          this.entries.set(page.entries);
          this.nextCursor.set(page.nextCursor);
          this.status.set('loaded');
        },
        error: () => this.status.set('error'),
      });
  }

  /** "Fri 9 Oct, 11:41 a.m." */
  protected when(entry: AuditEntry): string {
    const date = entry.occurredAt.slice(0, 10) as CalendarDate;
    return this.transloco.translate('admin.audit.when', {
      date: this.format.shortDate(date),
      time: this.format.time(entry.occurredAt),
    });
  }

  /** "priya@zamaro.ca · Administrator". */
  protected actorCaption(entry: AuditEntry): string {
    if (!entry.actor) return '';
    const role = entry.actor.role
      ? this.transloco.translate(`admin.audit.role.${entry.actor.role}`)
      : '';
    return role ? `${entry.actor.email} · ${role}` : entry.actor.email;
  }

  /** "User · Priya Nair", "Booking · ZAM-0101", or "—". */
  protected target(entry: AuditEntry): string {
    if (!entry.target) return '—';
    return entry.target.label ? `${entry.target.type} · ${entry.target.label}` : entry.target.type;
  }

  protected outcomeVariant(entry: AuditEntry): 'success' | 'danger' {
    return entry.outcome === 'succeeded' ? 'success' : 'danger';
  }

  private daysAgo(days: number): CalendarDate {
    const date = new Date(`${this.today}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() - days);
    return date.toISOString().slice(0, 10) as CalendarDate;
  }
}
