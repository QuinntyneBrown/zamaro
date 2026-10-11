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
import { ACCOUNT_API, AuthService, type Church, type ChurchDetails } from 'api';
import {
  Alert,
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
  | 'contactPhone';

interface FieldError {
  message: string;
  summary: string;
}

/** A refused church address: one the lookup could not find, or one outside the service area. */
type AddressProblem = 'not-found' | 'outside' | null;

/** The control `id` each field's error summary link focuses, as in the mock. */
const FIELD_IDS: Record<Field, string> = {
  name: 'full-name',
  churchName: 'church-name',
  streetAddress: 'street',
  city: 'city',
  postalCode: 'postal',
  churchPhone: 'church-phone',
  attendance: 'attendance',
  contactPhone: 'contact-phone',
};

const POSTAL_CODE = /^[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d$/;

/** A North American number: ten digits with or without a leading 1, area code and exchange from 2. */
function isNorthAmericanPhone(value: string): boolean {
  if (/[^\d\s().+-]/.test(value)) return false;
  let digits = value.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) digits = digits.slice(1);
  return /^[2-9]\d{2}[2-9]\d{6}$/.test(digits);
}

/**
 * Account settings at `/account` (accounts/manage-account-settings, docs/mocks/pages/account): one
 * form of sections saved together from the sticky save bar. A booker keeps their church here
 * (accounts/manage-church-profile), an artist their private contact phone (L2-025.4). Save changes
 * sends each section that changed, or was saved before, to its own endpoint; an invalid or failed
 * save keeps every value (L2-108). Email, Password, Email preferences, Two-step sign-in and
 * Signed-in devices join with their slices.
 */
@Component({
  selector: 'zm-account',
  imports: [
    Alert,
    Banner,
    Button,
    ButtonLink,
    ErrorSummary,
    FormActions,
    FormField,
    FormSection,
    Icon,
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

  protected readonly form = inject(NonNullableFormBuilder).group({
    name: [''],
    church: inject(NonNullableFormBuilder).group({
      name: [''],
      streetAddress: [''],
      city: [''],
      postalCode: [''],
      phone: [''],
      denomination: [''],
      typicalAttendance: [''],
    }),
    contactPhone: [''],
  });

  protected readonly load = signal<Load>('loading');
  protected readonly status = signal<SaveStatus>('idle');
  protected readonly errors = signal<Partial<Record<Field, FieldError>>>({});
  protected readonly addressProblem = signal<AddressProblem>(null);
  protected readonly bannerShown = signal(false);
  protected readonly section = signal('profile');
  /** The church as last saved; null until the booker saves one. */
  private readonly savedChurch = signal<Church | null>(null);
  private savedContactPhone: string | null = null;
  private readonly summary = viewChild(ErrorSummary);

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
    { id: 'profile', label: this.transloco.translate('accounts.account.profile.title') },
    this.isArtist()
      ? { id: 'contact', label: this.transloco.translate('accounts.account.contact.title') }
      : { id: 'church', label: this.transloco.translate('accounts.account.church.title') },
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
      title: this.transloco.translate('accounts.account.pageTitle'),
      description: this.transloco.translate('accounts.account.pageTitle'),
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
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ church, contactPhone }) => {
          this.savedChurch.set(church);
          this.savedContactPhone = contactPhone;
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
    const sendChurch = !this.isArtist() && this.churchChanged();
    const sendContact =
      this.isArtist() && (this.savedContactPhone !== null || this.contactChanged());
    const errors = this.check(sendChurch, sendContact);
    if (Object.keys(errors).length) {
      this.showErrors(errors, wasInvalid);
      return;
    }

    this.errors.set({});
    this.bannerShown.set(false);
    this.status.set('saving');
    try {
      const { name, contactPhone } = this.form.getRawValue();
      if (name.trim() !== this.user()?.name) {
        this.auth.replace(await firstValueFrom(this.api.updateProfile(name)));
      }
      if (sendChurch) {
        this.savedChurch.set(await firstValueFrom(this.api.saveChurch(this.churchDetails())));
        this.auth.load();
      }
      if (sendContact) {
        this.savedContactPhone = await firstValueFrom(this.api.saveContactPhone(contactPhone));
      }
      this.reset();
      this.status.set('saved');
      this.bannerShown.set(true);
    } catch (error) {
      this.failed(error, wasInvalid);
    }
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

  private failed(error: unknown, wasInvalid: boolean): void {
    const serverErrors =
      error instanceof HttpErrorResponse && error.status === 422
        ? ((error.error?.errors ?? {}) as Record<string, string[]>)
        : null;
    if (!serverErrors) {
      this.status.set('failed');
      return;
    }
    const errors: Partial<Record<Field, FieldError>> = {};
    if (serverErrors['serviceArea']) {
      this.addressProblem.set('outside');
      errors.streetAddress = this.addressError('outside');
    } else if (serverErrors['streetAddress']) {
      this.addressProblem.set('not-found');
      errors.streetAddress = this.addressError('notFound');
    }
    const fields: Record<string, Field> = {
      name: 'name',
      postalCode: 'postalCode',
      phone: 'churchPhone',
      typicalAttendance: 'attendance',
      contactPhone: 'contactPhone',
      city: 'city',
    };
    for (const [key, field] of Object.entries(fields)) {
      if (serverErrors[key]) errors[field] = this.error(this.checkKey(field));
    }
    if (serverErrors['name'] && !errors.name) errors.name = this.error('nameMissing');
    this.showErrors(errors, wasInvalid);
  }

  private showErrors(errors: Partial<Record<Field, FieldError>>, wasInvalid: boolean): void {
    this.errors.set(errors);
    this.status.set('invalid');
    // A summary already on screen is not created again, so it does not take focus itself.
    if (wasInvalid) afterNextRender(() => this.summary()?.focus(), { injector: this.injector });
  }

  /** What the form can tell before sending, for the sections that will be sent. */
  private check(church: boolean, contact: boolean): Partial<Record<Field, FieldError>> {
    const value = this.form.getRawValue();
    const errors: Partial<Record<Field, FieldError>> = {};
    if (!value.name.trim()) errors.name = this.error('nameMissing');
    if (church) {
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
    if (contact && !isNorthAmericanPhone(value.contactPhone)) {
      errors.contactPhone = this.error('phone');
    }
    return errors;
  }

  private checkKey(field: Field): string {
    const keys: Record<Field, string> = {
      name: 'nameMissing',
      churchName: 'churchName',
      streetAddress: 'streetMissing',
      city: 'cityMissing',
      postalCode: 'postalCode',
      churchPhone: 'phone',
      attendance: 'attendance',
      contactPhone: 'phone',
    };
    return keys[field];
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

  /** The church is sent when it was saved before or anything in it was typed. */
  private churchChanged(): boolean {
    if (this.savedChurch()) return true;
    return Object.values(this.form.getRawValue().church).some((value) => value.trim() !== '');
  }

  private contactChanged(): boolean {
    return this.form.getRawValue().contactPhone.trim() !== '';
  }

  /** The form as last saved. */
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

  private error(key: string): FieldError {
    return { message: this.t(`errors.${key}`), summary: this.t(`errors.${key}Summary`) };
  }

  private t(key: string, params: Record<string, unknown> = {}): string {
    return this.transloco.translate(`accounts.account.${key}`, params);
  }
}
