import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import {
  ADMIN_ARTIST_APPLICATIONS_API,
  type AdminApplication,
  type AdminApplicationReference,
  type AdminApplicationVideo,
  type CalendarDate,
  FormatService,
} from 'api';
import {
  Alert,
  Badge,
  Breadcrumb,
  Button,
  ButtonLink,
  Checkbox,
  type Crumb,
  type DescriptionItem,
  Icon,
  InlineMessage,
  Skeleton,
  ToastService,
  VideoCard,
} from 'components';
import { map } from 'rxjs';
import { PageTitle } from '../../shared/page-title';
import { VscDocumentLink } from '../../shell/vsc-document-link';

type Status = 'loading' | 'loaded' | 'error';

/** One reference with the form control behind its Verified tick. */
interface ReferenceRow {
  reference: AdminApplicationReference;
  control: FormControl<boolean>;
  /** The instruction, or "Verified by Priya Nair, Fri 9 Oct, 1:50 p.m." */
  description: string;
  details: DescriptionItem[];
}

/** A video as `zm-video-card` draws it. */
interface VideoRow {
  id: string;
  title: string;
  stamp: string;
  label: string;
  poster: AdminApplicationVideo['poster'];
  stream: string | null;
}

/**
 * The application review screen at `/admin/applications/{id}` (docs/mocks/pages/admin-application,
 * review-artist-application, L2-067.1, L2-048): every applicant detail, the bio and videos, both
 * references with a Verified tick that saves at once, the Vulnerable Sector Check, and the decision.
 * Approve stays locked until both references are verified (L2-048.1); the rejection dialog is the
 * next slice.
 */
@Component({
  selector: 'zm-application-page',
  imports: [
    Alert,
    Badge,
    Breadcrumb,
    Button,
    ButtonLink,
    Checkbox,
    Icon,
    InlineMessage,
    ReactiveFormsModule,
    Skeleton,
    TranslocoPipe,
    VideoCard,
    VscDocumentLink,
  ],
  host: { '[attr.aria-busy]': "status() === 'loading' ? 'true' : null" },
  templateUrl: './application.html',
  styleUrl: './application.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplicationPage {
  private readonly api = inject(ADMIN_ARTIST_APPLICATIONS_API);
  private readonly transloco = inject(TranslocoService);
  private readonly format = inject(FormatService);
  private readonly toasts = inject(ToastService);
  private readonly announcer = inject(LiveAnnouncer);
  private readonly destroyRef = inject(DestroyRef);
  private readonly pageTitle = inject(PageTitle);

  private readonly id = toSignal(
    inject(ActivatedRoute).paramMap.pipe(map((params) => Number(params.get('id')))),
    { initialValue: 0 },
  );

  protected readonly status = signal<Status>('loading');
  protected readonly application = signal<AdminApplication | null>(null);
  protected readonly references = signal<ReferenceRow[]>([]);
  protected readonly approving = signal(false);

  protected readonly crumbs = computed<Crumb[]>(() => [
    { label: this.transloco.translate('admin.nav.applications'), link: '/applications' },
    {
      label:
        this.application()?.name ??
        (this.status() === 'loading'
          ? this.transloco.translate('admin.application.loading.crumb')
          : this.transloco.translate('admin.application.loading.title')),
    },
  ]);

  /** "Application A-0219". */
  protected readonly overline = computed(() => {
    const application = this.application();
    return application
      ? this.transloco.translate('admin.application.overline', { number: application.number })
      : this.transloco.translate('admin.application.loading.overline');
  });

  /** "Solo vocalist · Acoustic, Hymns · Scarborough, ON · submitted Fri 9 Oct, 10:42 a.m." */
  protected readonly subtitle = computed(() => {
    const application = this.application();
    if (!application) return '';
    const [first, ...rest] = application.styles.map((style) =>
      this.transloco.translate(`common.style.${style}`),
    );
    const styles = rest.length > 0 ? `${first ?? ''} · ${rest.join(', ')}` : (first ?? '');
    return this.transloco.translate('admin.application.subtitle', {
      styles,
      city: application.baseCity,
      date: this.format.shortDate(application.submittedAt.slice(0, 10) as CalendarDate),
      time: this.format.time(application.submittedAt),
    });
  });

  protected readonly statusVariant = computed<'info' | 'success' | 'danger'>(() => {
    const status = this.application()?.status;
    return status === 'approved' ? 'success' : status === 'rejected' ? 'danger' : 'info';
  });

  /** The applicant's first name: "Tobi". */
  protected readonly firstName = computed(() => this.application()?.name.split(' ')[0] ?? '');

  protected readonly details = computed<DescriptionItem[]>(() => {
    const application = this.application();
    if (!application) return [];
    const t = (key: string, params?: Record<string, unknown>) =>
      this.transloco.translate(`admin.application.applicant.${key}`, params);
    return [
      { id: 'name', term: t('name'), value: application.name },
      { id: 'email', term: t('email'), value: application.email },
      {
        id: 'act',
        term: t('act'),
        value: this.transloco.translate(`common.act.${application.actType}`),
      },
      { id: 'city', term: t('city'), value: application.baseCity },
      {
        id: 'styles',
        term: t('styles'),
        value: application.styles
          .map((style) => this.transloco.translate(`common.style.${style}`))
          .join(', '),
      },
      {
        id: 'price',
        term: t('price'),
        value: t('priceValue', { price: this.format.money(application.fromPriceCents) }),
      },
      { id: 'drive', term: t('drive'), value: t('driveValue', { km: application.maxDriveKm }) },
      {
        id: 'submitted',
        term: t('submitted'),
        value: t('submittedValue', {
          date: this.format.shortDateWithYear(application.submittedAt.slice(0, 10) as CalendarDate),
          time: this.format.time(application.submittedAt),
        }),
      },
    ];
  });

  protected readonly videos = computed<VideoRow[]>(() =>
    (this.application()?.videos ?? []).map((video) => {
      const total = video.durationSeconds ?? 0;
      const minutes = Math.floor(total / 60);
      const seconds = total % 60;
      return {
        id: video.id,
        title: video.title,
        stamp: this.transloco.translate('artist.videos.stamp', {
          duration: `${minutes}:${String(seconds).padStart(2, '0')}`,
        }),
        label: this.transloco.translate('artist.videos.label', {
          title: video.title.replace(' — ', ', '),
          minutes,
          seconds,
        }),
        poster: video.poster,
        stream: video.stream,
      };
    }),
  );

  protected readonly artVariant = computed(() =>
    this.application()?.actType === 'solo' ? 'solo' : 'group',
  );

  protected readonly verifiedCount = computed(
    () => this.references().filter((row) => row.reference.verifiedAt !== null).length,
  );

  protected readonly canApprove = computed(
    () =>
      this.application()?.status === 'submitted' &&
      this.references().length > 0 &&
      this.verifiedCount() === this.references().length,
  );

  /** The decision once made: when, by whom, and what follows. */
  protected readonly decided = computed<DescriptionItem[]>(() => {
    const application = this.application();
    if (!application || application.status === 'submitted' || !application.decidedAt) return [];
    const t = (key: string, params?: Record<string, unknown>) =>
      this.transloco.translate(`admin.application.decision.${key}`, params);
    const when = {
      date: this.format.shortDate(application.decidedAt.slice(0, 10) as CalendarDate),
      time: this.format.time(application.decidedAt),
      name: application.decidedBy?.name ?? '',
    };
    if (application.status === 'approved') {
      return [
        { id: 'decision', term: t('decided'), value: t('approvedAt', when) },
        { id: 'role', term: t('role'), value: t('granted') },
        { id: 'profile', term: t('profile'), value: t('hidden') },
      ];
    }
    const rejection = application.rejection;
    return [
      { id: 'decision', term: t('decided'), value: t('rejectedAt', when) },
      {
        id: 'reason',
        term: t('reason'),
        value: rejection
          ? this.transloco.translate(`admin.application.rejection.reason.${rejection.reason}`)
          : '',
      },
      ...(rejection?.note ? [{ id: 'note', term: t('note'), value: rejection.note }] : []),
    ];
  });

  constructor() {
    this.pageTitle.set('admin.application.loading.title');
    inject(ActivatedRoute)
      .paramMap.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.load());
  }

  protected retry(): void {
    this.load();
  }

  protected approve(): void {
    const application = this.application();
    if (!application || !this.canApprove() || this.approving()) return;
    this.approving.set(true);
    this.api
      .approve(application.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (approved) => {
          this.approving.set(false);
          this.show(approved);
          void this.announcer.announce(
            this.transloco.translate('admin.application.approved.title', { name: approved.name }),
          );
        },
        error: (failure: { error?: { detail?: string } }) => {
          this.approving.set(false);
          this.fail(
            'admin.application.decision.approveFailed',
            failure.error?.detail ?? this.transloco.translate('admin.application.failedText'),
          );
          this.load();
        },
      });
  }

  /** "Issued Mon 5 Oct 2026 · Pending" for the applicant's latest check. */
  protected checkLine(check: NonNullable<AdminApplication['vsc']>): string {
    return this.transloco.translate('admin.application.check.issued', {
      date: this.format.shortDateWithYear(check.issuedOn),
      status: this.transloco.translate(`admin.application.check.status.${check.status}`),
    });
  }

  private load(): void {
    this.status.set('loading');
    this.application.set(null);
    this.references.set([]);
    this.api
      .show(this.id())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (application) => this.show(application),
        error: () => this.status.set('error'),
      });
  }

  private show(application: AdminApplication): void {
    this.application.set(application);
    this.pageTitle.set(application.name);
    this.references.set(application.references.map((reference) => this.row(reference)));
    this.status.set('loaded');
  }

  private row(reference: AdminApplicationReference): ReferenceRow {
    const control = new FormControl(reference.verifiedAt !== null, { nonNullable: true });
    if (this.application()?.status !== 'submitted') control.disable({ emitEvent: false });
    control.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((verified) => this.saveReference(reference.id, verified));
    return { reference, control, description: this.describe(reference), details: [] };
  }

  private describe(reference: AdminApplicationReference): string {
    return reference.verifiedAt === null
      ? this.transloco.translate('admin.application.references.instruction', {
          name: this.firstName(),
        })
      : this.transloco.translate('admin.application.references.verifiedBy', {
          name: reference.verifiedBy?.name ?? '',
          date: this.format.shortDate(reference.verifiedAt.slice(0, 10) as CalendarDate),
          time: this.format.time(reference.verifiedAt),
        });
  }

  private saveReference(referenceId: number, verified: boolean): void {
    const application = this.application();
    if (!application) return;
    this.api
      .verifyReference(application.id, referenceId, verified)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (saved) => {
          this.references.update((rows) =>
            rows.map((row) =>
              row.reference.id === saved.id
                ? { ...row, reference: saved, description: this.describe(saved) }
                : row,
            ),
          );
        },
        error: (failure: { error?: { detail?: string } }) => {
          const row = this.references().find((candidate) => candidate.reference.id === referenceId);
          row?.control.setValue(row.reference.verifiedAt !== null, { emitEvent: false });
          this.fail(
            'admin.application.references.saveFailed',
            failure.error?.detail ?? this.transloco.translate('admin.application.failedText'),
            row?.reference.name,
          );
        },
      });
  }

  private fail(titleKey: string, text: string, name = this.firstName()): void {
    const title = this.transloco.translate(titleKey, { name });
    this.toasts.show({
      variant: 'danger',
      title,
      text,
      dismissLabel: this.transloco.translate('common.toast.dismiss', { title }),
    });
  }
}
