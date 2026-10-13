import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  untracked,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { type CalendarDate, FormatService } from 'api';
import {
  Alert,
  Badge,
  Breadcrumb,
  Button,
  ButtonLink,
  Checkbox,
  type Crumb,
  type DescriptionItem,
  DescriptionList,
  Icon,
  Skeleton,
  ToastService,
  VideoCard,
} from 'components';
import { map } from 'rxjs';
import { PageTitle } from '../../shared/page-title';
import { ApplicationReviewStore } from './application-review.store';

/** A reference as the screen lists it: its details and the state of its tick. */
interface ReferenceRow {
  id: number;
  items: DescriptionItem[];
  verified: boolean;
  description: string;
}

/**
 * One application under review at `/admin/applications/{id}` (docs/mocks/pages/admin-application,
 * review-artist-application, L2-067.1): every applicant detail, the bio, the videos, the two church
 * references with their ticks, the Vulnerable Sector Check and the decision. Approve opens once both
 * references are verified (L2-048.1); approve and reject themselves come with M3 S14.
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
    DescriptionList,
    FormsModule,
    Icon,
    Skeleton,
    TranslocoPipe,
    VideoCard,
  ],
  providers: [ApplicationReviewStore],
  host: { '[attr.aria-busy]': "status() === 'loading' ? 'true' : null" },
  templateUrl: './application.html',
  styleUrl: './application.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplicationPage {
  protected readonly store = inject(ApplicationReviewStore);
  private readonly transloco = inject(TranslocoService);
  private readonly format = inject(FormatService);
  private readonly toasts = inject(ToastService);
  private readonly pageTitle = inject(PageTitle);

  private readonly id = toSignal(
    inject(ActivatedRoute).paramMap.pipe(map((params) => Number(params.get('id')))),
    { initialValue: 0 },
  );

  protected readonly status = this.store.status;
  protected readonly application = this.store.application;

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

  /** "Application A-0219", or the section while loading. */
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
    const styles = application.styles.map((style) =>
      this.transloco.translate(`common.style.${style}`),
    );
    const [lead, ...rest] = styles;
    return this.transloco.translate('admin.application.subtitle', {
      styles: rest.length ? `${lead} · ${rest.join(', ')}` : lead,
      city: this.transloco.translate('admin.cityProvince', { city: application.baseCity }),
      when: this.when(application.submittedAt),
    });
  });

  protected readonly statusVariant = computed<'info' | 'success' | 'danger'>(() => {
    switch (this.application()?.status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'danger';
      default:
        return 'info';
    }
  });

  /** "Tobi" for a solo act, the whole name for a group. */
  protected readonly firstName = computed(() => {
    const application = this.application();
    if (!application) return '';
    return application.actType === 'solo'
      ? (application.name.split(/\s+/)[0] ?? application.name)
      : application.name;
  });

  protected readonly applicant = computed<DescriptionItem[]>(() => {
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
      {
        id: 'city',
        term: t('city'),
        value: this.transloco.translate('admin.cityProvince', { city: application.baseCity }),
      },
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
      {
        id: 'distance',
        term: t('distance'),
        value: t('distanceValue', { km: application.maxDriveKm }),
      },
      {
        id: 'submitted',
        term: t('submitted'),
        value: this.transloco.translate('admin.applications.submittedAt', {
          date: this.format.shortDateWithYear(application.submittedAt.slice(0, 10) as CalendarDate),
          time: this.format.time(application.submittedAt),
        }),
      },
    ];
  });

  protected readonly bioLength = computed(() => [...(this.application()?.bio ?? '')].length);

  protected readonly artVariant = computed<'solo' | 'group'>(() =>
    this.application()?.actType === 'solo' ? 'solo' : 'group',
  );

  protected readonly videos = computed(() =>
    (this.application()?.videos ?? []).map((video) => {
      const minutes = Math.floor(video.durationSeconds / 60);
      const seconds = video.durationSeconds % 60;
      return {
        id: video.id,
        title: video.title,
        stamp: this.transloco.translate('admin.application.videos.stamp', {
          duration: `${minutes}:${String(seconds).padStart(2, '0')}`,
        }),
        // "Play Way Maker, live at Cornerstone, 5 minutes 48 seconds".
        label: this.transloco.translate('admin.application.videos.label', {
          title: video.title.replace(' — ', ', '),
          minutes,
          seconds,
        }),
        poster: video.poster,
        stream: video.stream,
      };
    }),
  );

  protected readonly references = computed<ReferenceRow[]>(() =>
    (this.application()?.references ?? []).map((reference) => {
      const t = (key: string, params?: Record<string, unknown>) =>
        this.transloco.translate(`admin.application.references.${key}`, params);
      return {
        id: reference.id,
        items: [
          { id: 'name', term: t('name'), value: reference.name },
          { id: 'church', term: t('church'), value: reference.church },
          { id: 'contact', term: t('contact'), value: reference.contact },
        ],
        verified: reference.verifiedAt !== null,
        description: reference.verifiedAt
          ? t('verifiedBy', {
              name: reference.verifiedBy?.name ?? '',
              date: this.format.shortDate(reference.verifiedAt.slice(0, 10) as CalendarDate),
              time: this.format.time(reference.verifiedAt),
            })
          : t('tickHelp', { name: this.firstName() }),
      };
    }),
  );

  /** "Waiting for verification · issued Fri 25 Sep 2026". */
  protected readonly checkSummary = computed(() => {
    const check = this.application()?.vulnerableSectorCheck;
    if (!check) return '';
    const status =
      check.status === 'verified'
        ? this.transloco.translate('admin.application.vsc.status.verified', {
            date: check.expiresOn ? this.format.shortDateWithYear(check.expiresOn) : '',
          })
        : this.transloco.translate(`admin.application.vsc.status.${check.status}`);
    return this.transloco.translate('admin.application.vsc.summary', {
      status,
      date: this.format.shortDateWithYear(check.issuedOn),
    });
  });

  constructor() {
    this.pageTitle.set('admin.application.loading.title');
    effect(() => {
      const id = this.id();
      untracked(() => this.store.load(id));
    });
    effect(() => {
      const application = this.application();
      if (application) this.pageTitle.setText(application.name);
    });
    effect(() => {
      const failed = this.store.tickFailed();
      if (!failed) return;
      const title = this.transloco.translate('admin.application.references.tickFailed');
      this.toasts.show({
        variant: 'danger',
        title,
        text: this.transloco.translate('admin.application.references.tickFailedText'),
        dismissLabel: this.transloco.translate('common.toast.dismiss', { title }),
      });
    });
  }

  protected retry(): void {
    this.store.load(this.id());
  }

  protected tick(referenceId: number, verified: boolean): void {
    const reference = this.application()?.references.find((row) => row.id === referenceId);
    if (reference) this.store.setReferenceVerification(reference, verified);
  }

  /** "Fri 9 Oct, 10:42 a.m." */
  private when(instant: string): string {
    return this.transloco.translate('admin.applications.submittedAt', {
      date: this.format.shortDate(instant.slice(0, 10) as CalendarDate),
      time: this.format.time(instant),
    });
  }
}
