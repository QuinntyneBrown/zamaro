import { HttpErrorResponse } from '@angular/common/http';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  Injector,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import {
  ACCOUNT_API,
  type AccountSession,
  AuthService,
  type Church,
  type ChurchDetails,
  FormatService,
} from 'api';
import {
  Alert,
  Badge,
  Banner,
  Button,
  ButtonLink,
  ErrorSummary,
  type ErrorSummaryItem,
  FormActions,
  type FormActionsTone,
  FormField,
  FormSection,
  Icon,
  List,
  type ListItem,
  ListTrail,
  type SettingsSection,
  SettingsNav,
} from 'components';
import { firstValueFrom, forkJoin, of } from 'rxjs';
import { PageMeta } from '../../shared/page-meta';

type Load = 'loading' | 'ready' | 'error';
type SaveStatus = 'idle' | 'invalid' | 'saving' | 'saved' | 'failed';
type Field =
  | 'name'
  | 'churchName'
  | 'streetAddress'
  | 'city'
  | 'postalCode'
  | 'churchPhone'
  | 'attendance'
  | 'contactPhone'
  | 'newEmail'
  | 'emailPassword'
  | 'currentPassword'
  | 'newPassword';
type Section = 'profile' | 'church' | 'contact' | 'email' | 'password';
type Errors = Partial<Record<Field, FieldError>>;

interface FieldError {
  message: string;
  summary: string;
}

/** A refused church address: one the lookup could not find, or one outside the service area. */
type AddressProblem = 'not-found' | 'outside' | null;

/** The control `id` each field's error summary link focuses, as in the mock; in page order. */
const FIELD_IDS: Record<Field, string> = {
  name: 'full-name',
  churchName: 'church-name',
  streetAddress: 'street',
  city: 'city',
  postalCode: 'postal',
  churchPhone: 'church-phone',
  attendance: 'attendance',
  contactPhone: 'contact-phone',
  newEmail: 'new-email',
  emailPassword: 'email-password',
  currentPassword: 'current-password',
  newPassword: 'new-password',
};

const POSTAL_CODE = /^[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN = 12;
const PASSWORD_MAX = 128;

/** A North American number: ten digits with or without a leading 1, area code and exchange from 2. */
function isNorthAmericanPhone(value: string): boolean {
  if (/[^\d\s().+-]/.test(value)) return false;
  let digits = value.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) digits = digits.slice(1);
  return /^[2-9]\d{2}[2-9]\d{6}$/.test(digits);
}

/** A save the API refused, already turned into field errors. */
class Refused extends Error {
  constructor(readonly errors: Errors) {
    super('refused');
  }
}

/**
 * Account settings at `/account` (accounts/manage-account-settings, docs/mocks/pages/account): one
 * form of sections saved together from the sticky save bar. A booker keeps their church here
 * (accounts/manage-church-profile), an artist their private contact phone (L2-025.4); anyone can ask
 * for a new email (L2-025.1) or set a new password (L2-025.2). Save changes sends each section that
 * changed to its own endpoint, in page order; an invalid or failed save keeps every value (L2-108).
 * Email preferences, Two-step sign-in and Signed-in devices join with their slices.
 */
@Component({
  selector: 'zm-account',
  imports: [
    Alert,
    Badge,
    Banner,
    Button,
    ButtonLink,
    ErrorSummary,
    FormActions,
    FormField,
    FormSection,
    Icon,
    List,
    ListTrail,
    ReactiveFormsModule,
    SettingsNav,
    TranslocoPipe,
  ],
  templateUrl: './account.html',
  styleUrl: './account.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Account {
  private readonly api = inject(ACCOUNT_API);
  private readonly auth = inject(AuthService);
  private readonly transloco = inject(TranslocoService);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly format = inject(FormatService);

  protected readonly form = this.fb.group({
    name: [''],
    church: this.fb.group({
      name: [''],
      streetAddress: [''],
      city: [''],
      postalCode: [''],
      phone: [''],
      denomination: [''],
      typicalAttendance: [''],
    }),
    contactPhone: [''],
    email: this.fb.group({ newEmail: [''], currentPassword: [''] }),
    password: this.fb.group({ currentPassword: [''], newPassword: [''] }),
  });

  protected readonly load = signal<Load>('loading');
  protected readonly status = signal<SaveStatus>('idle');
  protected readonly errors = signal<Errors>({});
  protected readonly addressProblem = signal<AddressProblem>(null);
  protected readonly bannerShown = signal(false);
  protected readonly section = signal('profile');
  /** The church as last saved; null until the booker saves one. */
  private readonly savedChurch = signal<Church | null>(null);
  private savedContactPhone: string | null = null;
  /** The new address a link was sent to, until it is opened (L2-025.1). */
  protected readonly pendingEmail = signal<string | null>(null);
  private readonly summary = viewChild(ErrorSummary);
  /** The signed-in devices, this one first (L2-025.3). */
  protected readonly sessions = signal<AccountSession[]>([]);
  protected readonly ending = signal<string | null>(null);

  /** "Chrome on Windows" over "Burlington, ON · This device · active now". */
  protected readonly devices = computed<ListItem[]>(() =>
    this.sessions().map((session) => {
      const place = session.approximateCity
        ? this.t('devices.place', { city: session.approximateCity })
        : '';
      return {
        id: session.id,
        title: session.deviceLabel,
        meta: session.isCurrent
          ? this.t('devices.current', { place })
          : this.t('devices.other', { place, ago: this.format.ago(session.lastActiveAt) }),
      };
    }),
  );
  /** The sessions a new password would end. */
  protected readonly otherSessions = computed(
    () => this.sessions().filter((session) => !session.isCurrent).length,
  );

  protected readonly user = this.auth.currentUser;
  protected readonly isArtist = computed(() => !!this.user()?.roles.includes('artist'));
  protected readonly ids = FIELD_IDS;

  /** "Naomi Fraser · Riverside Community Church", "Abigail Mensah · Artist". */
  protected readonly subtitle = computed(() => {
    const name = this.user()?.name ?? '';
    if (this.isArtist()) return `${name} · ${this.transloco.translate('accounts.account.artist')}`;
    const church = this.savedChurch();
    return church ? `${name} · ${church.name}` : name;
  });

  protected readonly sections = computed<SettingsSection[]>(() => [
    { id: 'profile', label: this.t('profile.title') },
    this.isArtist()
      ? { id: 'contact', label: this.t('contact.title') }
      : { id: 'church', label: this.t('church.title') },
    { id: 'email', label: this.t('email.title') },
    { id: 'password', label: this.t('password.title') },
    { id: 'devices', label: this.t('devices.title') },
  ]);

  protected readonly summaryItems = computed<ErrorSummaryItem[]>(() =>
    (Object.keys(FIELD_IDS) as Field[])
      .filter((field) => this.errors()[field])
      .map((field) => ({ fieldId: FIELD_IDS[field], message: this.errors()[field]!.summary })),
  );

  protected readonly summaryHeading = computed(() =>
    this.addressProblem()
      ? this.t('summaryChurch')
      : this.t('summary', { count: this.summaryItems().length }),
  );

  protected readonly statusText = computed(() => {
    switch (this.status()) {
      case 'saving':
        return this.t('saving');
      case 'saved':
        return this.t('savedNow');
      case 'failed':
        return this.t('notSaved');
      case 'invalid':
        if (this.addressProblem() === 'outside') return this.t('outsideStatus');
        if (this.addressProblem() === 'not-found') return this.t('notFoundStatus');
        return this.t('toFix', { count: this.summaryItems().length });
      default:
        return '';
    }
  });

  protected readonly statusTone = computed<FormActionsTone>(() => {
    const status = this.status();
    if (status === 'saved') return 'success';
    return status === 'invalid' || status === 'failed' ? 'danger' : 'neutral';
  });

  protected readonly saving = computed(() => this.status() === 'saving');

  constructor() {
    inject(PageMeta).set({
      title: this.t('pageTitle'),
      description: this.t('pageTitle'),
      path: '/account',
    });
    this.fetch();
  }

  /** Loads the settings into the form; Try again calls it after a failed load. */
  protected fetch(): void {
    this.load.set('loading');
    const artist = this.isArtist();
    forkJoin({
      church: artist ? of(null) : this.api.church(),
      contactPhone: artist ? this.api.contactPhone() : of(null),
      sessions: this.api.sessions(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ church, contactPhone, sessions }) => {
          this.savedChurch.set(church);
          this.savedContactPhone = contactPhone;
          this.sessions.set(sessions);
          this.pendingEmail.set(this.user()?.pendingEmail ?? null);
          this.reset();
          this.load.set('ready');
        },
        error: () => this.load.set('error'),
      });
  }

  protected async save(): Promise<void> {
    if (this.saving()) return;
    const wasInvalid = this.status() === 'invalid';
    this.addressProblem.set(null);
    const sending = this.sectionsToSend();
    const errors = this.check(sending);
    if (Object.keys(errors).length) {
      this.showErrors(errors, wasInvalid);
      return;
    }

    this.errors.set({});
    this.bannerShown.set(false);
    this.status.set('saving');
    try {
      for (const section of sending) await this.send(section);
      this.reset();
      this.status.set('saved');
      this.bannerShown.set(true);
    } catch (error) {
      if (error instanceof Refused) this.showErrors(error.errors, wasInvalid);
      else this.status.set('failed');
    }
  }

  /** End session: that device is signed out at once, with no confirmation (L2-025.3). */
  protected endSession(id: string): void {
    if (this.ending()) return;
    this.ending.set(id);
    this.api
      .endSession(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.sessions.update((sessions) => sessions.filter((session) => session.id !== id));
          this.ending.set(null);
        },
        error: () => this.ending.set(null),
      });
  }

  /** Discard: back to what was last saved. */
  protected discard(event: Event): void {
    event.preventDefault();
    this.reset();
    this.status.set('idle');
  }

  protected fieldError(field: Field): string | null {
    return this.errors()[field]?.message ?? null;
  }

  /** City and postal code are invalid with the street when the address is refused (out-of-area mock). */
  protected addressInvalid(): boolean {
    return this.addressProblem() !== null;
  }

  /** The sections with something to send, in page order. */
  private sectionsToSend(): Section[] {
    const value = this.form.getRawValue();
    const sections: Section[] = [];
    if (value.name.trim() !== this.user()?.name) sections.push('profile');
    if (this.isArtist()) {
      if (this.savedContactPhone !== null || value.contactPhone.trim()) sections.push('contact');
    } else if (this.savedChurch() || Object.values(value.church).some((field) => field.trim())) {
      sections.push('church');
    }
    if (value.email.newEmail.trim()) sections.push('email');
    if (value.password.newPassword || value.password.currentPassword) sections.push('password');
    return sections;
  }

  /** Sends one section; a 422 becomes `Refused` with that section's field errors. */
  private async send(section: Section): Promise<void> {
    const value = this.form.getRawValue();
    try {
      switch (section) {
        case 'profile':
          this.auth.replace(await firstValueFrom(this.api.updateProfile(value.name)));
          break;
        case 'church':
          this.savedChurch.set(await firstValueFrom(this.api.saveChurch(this.churchDetails())));
          this.auth.load();
          break;
        case 'contact':
          this.savedContactPhone = await firstValueFrom(
            this.api.saveContactPhone(value.contactPhone),
          );
          break;
        case 'email':
          this.pendingEmail.set(
            await firstValueFrom(
              this.api.requestEmailChange(value.email.newEmail, value.email.currentPassword),
            ),
          );
          this.form.controls.email.reset();
          break;
        case 'password':
          await firstValueFrom(
            this.api.changePassword({
              currentPassword: value.password.currentPassword,
              password: value.password.newPassword,
              passwordConfirmation: value.password.newPassword,
            }),
          );
          this.form.controls.password.reset();
          // Every other session ended with the change.
          this.sessions.set(await firstValueFrom(this.api.sessions()));
          break;
      }
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 422) {
        throw new Refused(this.fromServer(section, error.error?.errors ?? {}));
      }
      throw error;
    }
  }

  /** The API's 422 for one section, as the page's own copy. */
  private fromServer(section: Section, serverErrors: Record<string, string[]>): Errors {
    const errors: Errors = {};
    const has = (key: string): boolean => !!serverErrors[key];
    if (section === 'profile' && has('name')) errors.name = this.error('nameMissing');
    if (section === 'church') {
      if (has('serviceArea')) {
        this.addressProblem.set('outside');
        errors.streetAddress = this.addressError('outside');
      } else if (has('streetAddress')) {
        this.addressProblem.set('not-found');
        errors.streetAddress = this.addressError('notFound');
      }
      if (has('name')) errors.churchName = this.error('churchName');
      if (has('city')) errors.city = this.error('cityMissing');
      if (has('postalCode')) errors.postalCode = this.error('postalCode');
      if (has('phone')) errors.churchPhone = this.error('phone');
      if (has('typicalAttendance')) errors.attendance = this.error('attendance');
    }
    if (section === 'contact' && has('contactPhone')) errors.contactPhone = this.error('phone');
    if (section === 'email') {
      if (has('email')) errors.newEmail = this.error('emailInvalid');
      if (has('currentPassword')) errors.emailPassword = this.error('wrongPassword');
    }
    if (section === 'password') {
      if (has('currentPassword')) errors.currentPassword = this.error('wrongPassword');
      if (has('password')) {
        errors.newPassword =
          this.passwordLengthError(this.form.getRawValue().password.newPassword) ??
          this.error('passwordBreached');
      }
    }
    return errors;
  }

  private showErrors(errors: Errors, wasInvalid: boolean): void {
    this.errors.set(errors);
    this.status.set('invalid');
    // A summary already on screen is not created again, so it does not take focus itself.
    if (wasInvalid) afterNextRender(() => this.summary()?.focus(), { injector: this.injector });
  }

  /** What the form can tell before sending, for the sections that will be sent. */
  private check(sections: Section[]): Errors {
    const value = this.form.getRawValue();
    const errors: Errors = {};
    if (!value.name.trim()) errors.name = this.error('nameMissing');
    if (sections.includes('church')) {
      const c = value.church;
      const name = c.name.trim().length;
      if (name < 2 || name > 120) errors.churchName = this.error('churchName');
      if (!c.streetAddress.trim()) errors.streetAddress = this.error('streetMissing');
      if (!c.city.trim()) errors.city = this.error('cityMissing');
      if (!POSTAL_CODE.test(c.postalCode.trim())) errors.postalCode = this.error('postalCode');
      if (!isNorthAmericanPhone(c.phone)) errors.churchPhone = this.error('phone');
      const attendance = c.typicalAttendance.trim();
      if (attendance && !/^[1-9]\d*$/.test(attendance))
        errors.attendance = this.error('attendance');
    }
    if (sections.includes('contact') && !isNorthAmericanPhone(value.contactPhone)) {
      errors.contactPhone = this.error('phone');
    }
    if (sections.includes('email')) {
      if (!EMAIL.test(value.email.newEmail.trim())) errors.newEmail = this.error('emailInvalid');
      if (!value.email.currentPassword) errors.emailPassword = this.error('passwordNeeded');
    }
    if (sections.includes('password')) {
      if (!value.password.currentPassword) {
        errors.currentPassword = this.error('passwordNeeded');
      }
      const length = this.passwordLengthError(value.password.newPassword);
      if (length) errors.newPassword = length;
    }
    return errors;
  }

  private passwordLengthError(password: string): FieldError | null {
    const count = [...password].length;
    if (count < PASSWORD_MIN) return this.error('passwordShort', { count });
    if (count > PASSWORD_MAX) return this.error('passwordLong', { count });
    return null;
  }

  private churchDetails(): ChurchDetails {
    const c = this.form.getRawValue().church;
    const attendance = c.typicalAttendance.trim();
    return {
      name: c.name,
      streetAddress: c.streetAddress,
      city: c.city,
      postalCode: c.postalCode,
      phone: c.phone,
      denomination: c.denomination.trim() || null,
      typicalAttendance: attendance ? Number(attendance) : null,
    };
  }

  /** The form as last saved; the email and password fields start empty. */
  private reset(): void {
    const church = this.savedChurch();
    this.form.reset({
      name: this.user()?.name ?? '',
      church: {
        name: church?.name ?? '',
        streetAddress: church?.streetAddress ?? '',
        city: church?.city ?? '',
        postalCode: church?.postalCode ?? '',
        phone: church?.phone ?? '',
        denomination: church?.denomination ?? '',
        typicalAttendance: church?.typicalAttendance?.toString() ?? '',
      },
      contactPhone: this.savedContactPhone ?? '',
    });
    this.errors.set({});
    this.addressProblem.set(null);
  }

  private addressError(key: 'outside' | 'notFound'): FieldError {
    const message = this.t(key);
    return { message, summary: message };
  }

  private error(key: string, params: Record<string, unknown> = {}): FieldError {
    return {
      message: this.t(`errors.${key}`, params),
      summary: this.t(`errors.${key}Summary`, params),
    };
  }

  private t(key: string, params: Record<string, unknown> = {}): string {
    return this.transloco.translate(`accounts.account.${key}`, params);
  }
}
