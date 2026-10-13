import { HttpErrorResponse } from '@angular/common/http';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  Injector,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import {
  type ActType,
  ARTIST_APPLICATIONS_API,
  type ArtistApplication,
  BOT_CHALLENGE,
  type CalendarDate,
  FormatService,
  type Style,
} from 'api';
import {
  Alert,
  Button,
  ButtonLink,
  Checkbox,
  CheckboxGroup,
  type DescriptionItem,
  DescriptionList,
  ErrorSummary,
  type ErrorSummaryItem,
  type FieldOption,
  FormActions,
  FormField,
  FormSection,
  Icon,
  Radio,
  RadioGroup,
  Stamp,
  Stepper,
  type StepperStep,
} from 'components';
import { map, switchMap } from 'rxjs';
import { PageMeta } from '../../shared/page-meta';
import { ApplicationStore } from './application.store';
import { ReferenceFieldset } from './reference-fieldset';
import { VideoUpload } from './video-upload';

type StepKey = 'about' | 'music' | 'price' | 'references';
type Status = 'editing' | 'submitting' | 'challenge' | 'inReview' | 'error' | 'sent';

interface Step {
  key: StepKey;
  path: string;
}

const STEPS: readonly Step[] = [
  { key: 'about', path: '/artists/apply' },
  { key: 'music', path: '/artists/apply/music' },
  { key: 'price', path: '/artists/apply/price' },
  { key: 'references', path: '/artists/apply/references' },
];

/** Every field the error summary can point at, in form order, with the step it sits on. */
const FIELDS: readonly { id: string; step: StepKey }[] = [
  { id: 'full-name', step: 'about' },
  { id: 'email', step: 'about' },
  { id: 'base-city', step: 'about' },
  { id: 'act', step: 'about' },
  { id: 'styles', step: 'music' },
  { id: 'bio', step: 'music' },
  { id: 'videos', step: 'music' },
  { id: 'price', step: 'price' },
  { id: 'distance', step: 'price' },
  { id: 'ref1-name', step: 'references' },
  { id: 'ref1-church', step: 'references' },
  { id: 'ref1-contact', step: 'references' },
  { id: 'ref2-name', step: 'references' },
  { id: 'ref2-church', step: 'references' },
  { id: 'ref2-contact', step: 'references' },
];

/** The API's field names, as the 422 answer writes them, to the form's. */
const SERVER_FIELDS: Record<string, string> = {
  name: 'full-name',
  email: 'email',
  baseCity: 'base-city',
  actType: 'act',
  styles: 'styles',
  bio: 'bio',
  videos: 'videos',
  fromPrice: 'price',
  maxDriveKm: 'distance',
  'references.0.name': 'ref1-name',
  'references.0.church': 'ref1-church',
  'references.0.contact': 'ref1-contact',
  'references.1.name': 'ref2-name',
  'references.1.church': 'ref2-church',
  'references.1.contact': 'ref2-contact',
};

const STYLES: readonly Style[] = [
  'band',
  'solo-vocalist',
  'gospel-choir',
  'acoustic',
  'hymns',
  'spanish',
];
const ACTS: readonly ActType[] = ['solo', 'duo', 'band', 'choir'];
const BIO_MIN = 100;
const BIO_MAX = 1500;
const BIO_START_CHARS = 48;

/**
 * Apply as an artist at `/artists/apply` (docs/mocks/pages/apply, L2-047): four steps under a
 * stepper, each a form that checks itself before Continue, every answer kept on this device until
 * Send; then "Application received" with the number and the reply-by date, focus on its heading.
 */
@Component({
  selector: 'zm-apply-page',
  imports: [
    Alert,
    Button,
    ButtonLink,
    Checkbox,
    CheckboxGroup,
    DescriptionList,
    ErrorSummary,
    FormActions,
    FormField,
    FormSection,
    Icon,
    Radio,
    RadioGroup,
    ReactiveFormsModule,
    ReferenceFieldset,
    RouterLink,
    Stamp,
    Stepper,
    TranslocoPipe,
    VideoUpload,
  ],
  providers: [ApplicationStore],
  templateUrl: './apply.html',
  styleUrl: './apply.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplyPage {
  protected readonly store = inject(ApplicationStore);
  private readonly api = inject(ARTIST_APPLICATIONS_API);
  private readonly botChallenge = inject(BOT_CHALLENGE);
  private readonly transloco = inject(TranslocoService);
  private readonly format = inject(FormatService);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);

  private readonly stepParam = toSignal(
    inject(ActivatedRoute).paramMap.pipe(map((params) => params.get('step') ?? '')),
    { initialValue: '' },
  );
  protected readonly current = computed<StepKey>(() => {
    const key = this.stepParam();
    return key === 'music' || key === 'price' || key === 'references' ? key : 'about';
  });
  protected readonly currentIndex = computed(() =>
    STEPS.findIndex((step) => step.key === this.current()),
  );

  private readonly builder = inject(NonNullableFormBuilder);
  protected readonly form = this.builder.group({
    about: this.builder.group({
      name: '',
      email: '',
      city: '',
      act: '' as ActType | '',
    }),
    music: this.builder.group({
      styles: this.builder.control<string[]>([]),
      bio: '',
    }),
    price: this.builder.group({ price: '', distance: '80' }),
    references: this.builder.array([
      this.builder.group({ name: '', church: '', contact: '' }),
      this.builder.group({ name: '', church: '', contact: '' }),
    ]),
  });

  protected readonly status = signal<Status>('editing');
  protected readonly busy = computed(() => this.status() === 'submitting');
  /** Field errors by field id, shown on the step that holds them. */
  protected readonly errors = signal<Record<string, string>>({});
  /** The email an application in review was sent from (409). */
  protected readonly inReviewEmail = signal('');
  /** The form's values, as a signal, for the review and the help lines. */
  private readonly values = toSignal(
    this.form.valueChanges.pipe(map(() => this.form.getRawValue())),
    {
      initialValue: this.form.getRawValue(),
    },
  );

  protected readonly actOptions = ACTS;
  protected readonly styleOptions = STYLES;
  protected readonly distanceOptions: FieldOption[] = Array.from({ length: 19 }, (_, index) => {
    const km = 20 + index * 10;
    return { value: String(km), label: this.transloco.translate('apply.price.km', { km }) };
  });

  protected readonly stepperSteps = computed<StepperStep[]>(() => {
    const sent = this.status() === 'sent';
    const errors = this.errors();
    return STEPS.map((step) => {
      const invalid = !sent && FIELDS.some((field) => field.step === step.key && errors[field.id]);
      // Done is a step whose answers pass, wherever the applicant is: after the server sends them
      // back to step 1, the three steps they finished stay done and linked (apply/outside-area).
      const done = sent || this.check(step.key, this.values()).size === 0;
      return {
        title: this.transloco.translate(`apply.steps.${step.key}`),
        current: !sent && step.key === this.current(),
        done,
        invalid,
        link:
          sent || step.key === this.current() ? undefined : done || invalid ? step.path : undefined,
      };
    });
  });

  /** The current step's errors, in form order, for the summary. */
  protected readonly summaryItems = computed<ErrorSummaryItem[]>(() =>
    FIELDS.filter((field) => field.step === this.current() && this.errors()[field.id]).map(
      (field) => ({
        fieldId: field.id,
        message: this.errors()[field.id] ?? '',
      }),
    ),
  );

  /** The send was refused or lost: the answers stay on this device (L2-108.3). */
  protected readonly notSent = computed(() =>
    ['challenge', 'inReview', 'error'].includes(this.status()),
  );

  protected readonly statusLine = computed(() => {
    if (this.busy()) return this.transloco.translate('apply.status.sending');
    const count = this.summaryItems().length;
    if (count > 0) return this.transloco.translate('apply.status.invalid', { count });
    if (this.notSent()) return this.transloco.translate('apply.status.notSent');
    return this.current() === 'references'
      ? this.transloco.translate('apply.status.review')
      : this.transloco.translate('apply.status.step', { step: this.currentIndex() + 1 });
  });

  protected readonly bioHelp = computed(() =>
    this.transloco.translate('apply.music.bioHelp', { count: [...this.values().music.bio].length }),
  );
  protected readonly priceHelp = computed(() => {
    const dollars = Number(this.values().price.price);
    return this.transloco.translate('apply.price.priceHelp', {
      price: this.format.money((Number.isFinite(dollars) && dollars > 0 ? dollars : 400) * 100),
    });
  });
  protected readonly distanceHelp = computed(() =>
    this.transloco.translate('apply.price.distanceHelp', {
      city: this.values().about.city.trim() || this.transloco.translate('apply.about.city'),
      km: this.values().price.distance,
    }),
  );

  protected readonly backPath = computed(() => STEPS[this.currentIndex() - 1]?.path ?? null);

  // The review.

  protected readonly aboutReview = computed<DescriptionItem[]>(() => {
    const about = this.values().about;
    return [
      { id: 'name', term: this.t('review.name'), value: about.name.trim() },
      { id: 'email', term: this.t('review.email'), value: about.email.trim() },
      {
        id: 'act',
        term: this.t('review.act'),
        value: about.act ? this.transloco.translate(`common.act.${about.act}`) : '',
      },
      {
        id: 'city',
        term: this.t('review.city'),
        value: this.t('review.cityValue', { city: about.city.trim() }),
      },
    ];
  });
  protected readonly musicReview = computed<DescriptionItem[]>(() => {
    const music = this.values().music;
    const bio = music.bio.trim();
    const videos = this.store.liveVideos();
    return [
      {
        id: 'styles',
        term: this.t('review.styles'),
        value: STYLES.filter((style) => music.styles.includes(style))
          .map((style) => this.transloco.translate(`common.style.${style}`))
          .join(', '),
      },
      {
        id: 'bio',
        term: this.t('review.bio'),
        value: this.t('review.bioValue', { count: [...bio].length, start: this.bioStart(bio) }),
      },
      {
        id: 'videos',
        term: this.t('review.videos'),
        value: this.t('review.videosValue', {
          count: videos.length,
          titles: videos.map((video) => video.title).join(', '),
        }),
      },
    ];
  });
  protected readonly priceReview = computed<DescriptionItem[]>(() => {
    const price = this.values().price;
    const dollars = Number(price.price);
    return [
      {
        id: 'price',
        term: this.t('review.fromPrice'),
        value: this.t('review.fromPriceValue', {
          price: Number.isFinite(dollars) ? this.format.money(dollars * 100) : '',
        }),
      },
      {
        id: 'distance',
        term: this.t('review.drives'),
        value: this.t('review.drivesValue', { km: price.distance }),
      },
    ];
  });

  // Application received.

  protected readonly sentApplication = computed(() => this.store.sent());
  /** "About 10 minutes · We reply within 3 business days", then "Tobi Adeyemi · Application A-0217". */
  protected readonly subtitle = computed(() => {
    const sent = this.sentApplication();
    return sent
      ? this.transloco.translate('apply.doneSubtitle', { name: sent.name, number: sent.number })
      : this.transloco.translate('apply.subtitle');
  });
  protected readonly firstName = computed(() => this.sentApplication()?.name.split(' ')[0] ?? '');
  protected readonly replyBy = computed(() => {
    const sent = this.sentApplication();
    return sent ? this.format.shortDate(sent.replyBy) : '';
  });
  protected readonly receipt = computed<DescriptionItem[]>(() => {
    const sent = this.sentApplication();
    if (!sent) return [];
    return [
      { id: 'number', term: this.t('done.application'), value: sent.number },
      { id: 'status', term: this.t('done.status'), value: this.t('done.statusSubmitted') },
      {
        id: 'sent',
        term: this.t('done.sent'),
        value: this.t('done.sentValue', {
          date: this.format.shortDate(sent.submittedAt.slice(0, 10) as CalendarDate),
          time: this.format.time(sent.submittedAt),
        }),
      },
      { id: 'replyBy', term: this.t('done.replyBy'), value: this.replyBy() },
    ];
  });
  protected readonly receiptFine = computed(() => {
    const holiday = this.sentApplication()?.skippedHolidays[0];
    if (!holiday) return this.t('done.fine');
    return this.t('done.fineHoliday', {
      day: `${this.format.weekday(holiday.date)} ${this.format.dayStamp(holiday.date).day}`,
      holiday: holiday.name,
    });
  });

  private readonly title = viewChild<ElementRef<HTMLElement>>('pageTitle');
  private readonly summary = viewChild(ErrorSummary);
  private readonly actGroup = viewChild<RadioGroup>('actGroup');
  private readonly stylesGroup = viewChild<CheckboxGroup>('stylesGroup');

  constructor() {
    inject(PageMeta).set({ title: this.transloco.translate('apply.pageTitle'), index: true });
    this.form.setValue(this.draftValue(), { emitEvent: true });
    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.save());
    afterNextRender(() => this.focusFirstField());
  }

  /** Continue: the step must pass before the next one opens. */
  protected continue(): void {
    const step = this.current();
    const errors = this.check(step, this.form.getRawValue());
    this.errors.set(Object.fromEntries(errors));
    if (errors.size > 0) {
      this.focusSummary();
      return;
    }
    const next = STEPS[this.currentIndex() + 1];
    if (next) {
      void this.router
        .navigateByUrl(next.path)
        .then(() => afterNextRender(() => this.focusFirstField(), { injector: this.injector }));
    }
  }

  /** Send application: everything is checked once more, then the bot check, then the API. */
  protected send(): void {
    if (this.busy()) return;
    const values = this.form.getRawValue();
    const errors = new Map<string, string>();
    for (const step of STEPS)
      for (const [id, message] of this.check(step.key, values)) errors.set(id, message);
    this.errors.set(Object.fromEntries(errors));
    if (errors.size > 0) {
      this.openStepWithErrors(errors);
      return;
    }
    this.status.set('submitting');
    this.form.disable({ emitEvent: false });
    this.botChallenge
      .token('artist-application')
      .pipe(
        switchMap((challengeToken) =>
          this.api.submit(
            {
              name: values.about.name.trim(),
              email: values.about.email.trim(),
              baseCity: values.about.city.trim(),
              actType: values.about.act as ActType,
              styles: STYLES.filter((style) => values.music.styles.includes(style)),
              bio: values.music.bio.trim(),
              fromPrice: Number(values.price.price),
              maxDriveKm: Number(values.price.distance),
              videos: this.store.liveVideos().map((video) => video.token),
              references: [
                this.reference(values.references[0]),
                this.reference(values.references[1]),
              ],
              challengeToken,
            },
            this.store.draft().idempotencyKey,
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (application) => this.received(application),
        error: (error: unknown) => this.failed(error),
      });
  }

  /** An error summary link: the group it names takes focus. */
  protected summaryItemActivated(fieldId: string): void {
    if (fieldId === 'act') this.actGroup()?.focus();
    if (fieldId === 'styles') this.stylesGroup()?.focus();
  }

  protected error(fieldId: string): string | null {
    return this.errors()[fieldId] ?? null;
  }

  protected referenceErrors(index: 1 | 2): {
    name: string | null;
    church: string | null;
    contact: string | null;
  } {
    return {
      name: this.error(`ref${index}-name`),
      church: this.error(`ref${index}-church`),
      contact: this.error(`ref${index}-contact`),
    };
  }

  protected referenceGroup(index: 0 | 1) {
    return this.form.controls.references.at(index);
  }

  private received(application: ArtistApplication): void {
    this.store.markSent(application);
    this.status.set('sent');
    afterNextRender(() => this.title()?.nativeElement.focus(), { injector: this.injector });
  }

  private failed(error: unknown): void {
    this.form.enable({ emitEvent: false });
    if (!(error instanceof HttpErrorResponse)) {
      this.status.set('error');
      return;
    }
    const body = (error.error ?? {}) as {
      errors?: Record<string, string[]>;
      email?: string;
      type?: string;
    };
    const serverErrors = body.errors ?? {};
    if (error.status === 422 && serverErrors['challengeToken']) {
      this.status.set('challenge');
    } else if (error.status === 422) {
      const errors = new Map<string, string>();
      for (const [key, messages] of Object.entries(serverErrors)) {
        const field = SERVER_FIELDS[key];
        if (field && messages[0]) errors.set(field, messages[0]);
      }
      this.status.set('editing');
      this.errors.set(Object.fromEntries(errors));
      if (errors.size > 0) this.openStepWithErrors(errors);
    } else if (error.status === 409 && body.type?.endsWith('/application-in-review')) {
      this.inReviewEmail.set(body.email ?? this.form.getRawValue().about.email.trim());
      this.status.set('inReview');
    } else {
      this.status.set('error');
    }
  }

  /** The step holding the first invalid field opens, with every answer kept (L2-001, L2-108.3). */
  private openStepWithErrors(errors: Map<string, string>): void {
    const first = FIELDS.find((field) => errors.has(field.id));
    const step = STEPS.find((candidate) => candidate.key === first?.step);
    if (!step || step.key === this.current()) {
      this.focusSummary();
      return;
    }
    void this.router.navigateByUrl(step.path).then(() => this.focusSummary());
  }

  private focusSummary(): void {
    afterNextRender(() => this.summary()?.focus(), { injector: this.injector });
  }

  private focusFirstField(): void {
    const first = FIELDS.find((field) => field.step === this.current());
    const element = first ? document.getElementById(first.id) : null;
    element?.focus();
  }

  /** What the form can tell before sending, by field id. */
  private check(
    step: StepKey,
    values: ReturnType<typeof this.form.getRawValue>,
  ): Map<string, string> {
    const errors = new Map<string, string>();
    const add = (id: string, key: string, params: Record<string, unknown> = {}) =>
      errors.set(id, this.transloco.translate(`apply.invalid.${key}`, params));
    switch (step) {
      case 'about': {
        const about = values.about;
        if (about.name.trim().length < 2) add('full-name', 'name');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(about.email.trim())) add('email', 'email');
        if (!about.city.trim()) add('base-city', 'city');
        if (!about.act) add('act', 'act');
        break;
      }
      case 'music': {
        const music = values.music;
        if (music.styles.length < 1 || music.styles.length > 4) add('styles', 'styles');
        const length = [...music.bio.trim()].length;
        if (length < BIO_MIN || length > BIO_MAX) add('bio', 'bio');
        if (this.store.liveVideos().length === 0) add('videos', 'videos');
        break;
      }
      case 'price': {
        const dollars = Number(values.price.price);
        if (!/^\d+$/.test(values.price.price.trim()) || dollars < 100 || dollars > 20000)
          add('price', 'price');
        const km = Number(values.price.distance);
        if (!Number.isInteger(km) || km < 20 || km > 200 || km % 10 !== 0)
          add('distance', 'distance');
        break;
      }
      case 'references': {
        const email = values.about.email.trim().toLowerCase();
        values.references.forEach((reference, index) => {
          const prefix = `ref${index + 1}`;
          const name = reference.name.trim();
          if (name.length < 2) add(`${prefix}-name`, 'referenceName');
          if (reference.church.trim().length < 2) add(`${prefix}-church`, 'referenceChurch');
          const contact = reference.contact.trim();
          if (!contact)
            add(`${prefix}-contact`, 'referenceContact', { name: this.shortName(name) });
          else if (email && contact.toLowerCase() === email)
            add(`${prefix}-contact`, 'referenceSelf');
        });
        break;
      }
    }
    return errors;
  }

  /** "Pastor Osei" from "Pastor Samuel Osei": the title and the surname, or the whole name. */
  private shortName(name: string): string {
    const words = name.split(/\s+/).filter(Boolean);
    if (words.length === 0) return this.t('references.legend', { index: '' }).trim();
    if (words.length === 1) return words[0] ?? '';
    const first = words[0] ?? '';
    const isTitle = /^(pastor|rev\.?|reverend|dr\.?|fr\.?|father|elder|bishop|deacon)$/i.test(
      first,
    );
    return isTitle ? `${first} ${words[words.length - 1]}` : (words[words.length - 1] ?? '');
  }

  /** The bio's first 48 characters, cut back to a whole word, without a trailing comma. */
  private bioStart(bio: string): string {
    const chars = [...bio];
    if (chars.length <= BIO_START_CHARS) return bio;
    const head = chars.slice(0, BIO_START_CHARS).join('');
    const wordy = /[\p{L}\p{N}]/u;
    const midWord = wordy.test(chars[BIO_START_CHARS]) && wordy.test(chars[BIO_START_CHARS - 1]);
    const cut = midWord ? head.lastIndexOf(' ') : head.length;
    return (cut > 20 ? head.slice(0, cut) : head).replace(/[,;:.]$/, '');
  }

  private reference(reference: { name: string; church: string; contact: string }) {
    return {
      name: reference.name.trim(),
      church: reference.church.trim(),
      contact: reference.contact.trim(),
    };
  }

  private t(key: string, params: Record<string, unknown> = {}): string {
    return this.transloco.translate(`apply.${key}`, params);
  }

  private save(): void {
    const values = this.form.getRawValue();
    this.store.patchAbout({ ...values.about });
    this.store.patchMusic({
      styles: STYLES.filter((style) => values.music.styles.includes(style)),
      bio: values.music.bio,
    });
    this.store.patchPrice({ ...values.price });
    this.store.patchReferences([{ ...values.references[0] }, { ...values.references[1] }] as [
      { name: string; church: string; contact: string },
      { name: string; church: string; contact: string },
    ]);
  }

  private draftValue() {
    const draft = this.store.draft();
    return {
      about: { ...draft.about },
      music: { styles: [...draft.music.styles], bio: draft.music.bio },
      price: { ...draft.price },
      references: [{ ...draft.references[0] }, { ...draft.references[1] }],
    };
  }
}
