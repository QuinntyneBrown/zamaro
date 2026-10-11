import { type Observable, of } from 'rxjs';
import type {
  AccountSession,
  Church,
  ChurchDetails,
  CurrentUser,
  TwoFactorKey,
} from '../models/accounts';
import type { AccountApi } from '../services/account';

/** Riverside Community Church as docs/mocks/README.md has it. */
export const RIVERSIDE: Church = {
  name: 'Riverside Community Church',
  streetAddress: '2150 Lakeshore Road',
  city: 'Burlington',
  province: 'ON',
  postalCode: 'L7R 1A3',
  phone: '905-555-0123',
  denomination: 'Non-denominational',
  typicalAttendance: 350,
};

/** Naomi's recovery codes (docs/mocks/pages/mfa-setup/codes). */
export const RECOVERY_CODES = [
  '7kq4-m2xd',
  'p9rt-4wza',
  'c3vn-8hye',
  'u6bs-1jqf',
  'e2lm-9tkc',
  'w8gd-3rnv',
  'h5xp-7aum',
  'z1fy-6cwe',
  'r4nq-2dsb',
  'j7ve-5pkh',
];

/** Naomi's three signed-in devices (docs/mocks/pages/account). */
export const NAOMIS_DEVICES: AccountSession[] = [
  {
    id: 'chrome',
    deviceLabel: 'Chrome on Windows',
    approximateCity: 'Burlington, ON',
    lastActiveAt: '2026-10-09T10:00:00-04:00',
    isCurrent: true,
  },
  {
    id: 'safari',
    deviceLabel: 'Safari on iPhone',
    approximateCity: 'Burlington, ON',
    lastActiveAt: '2026-10-09T08:00:00-04:00',
    isCurrent: false,
  },
  {
    id: 'firefox',
    deviceLabel: 'Firefox on Mac',
    approximateCity: 'Hamilton, ON',
    lastActiveAt: '2026-10-06T19:30:00-04:00',
    isCurrent: false,
  },
];

/** In-memory AccountApi for scenarios and component tests: it keeps what it is given. */
export class InMemoryAccountApi implements AccountApi {
  constructor(
    private readonly user: CurrentUser,
    private storedChurch: Church | null = RIVERSIDE,
    private phone: string | null = null,
    private devices: AccountSession[] = NAOMIS_DEVICES,
  ) {}

  updateProfile(name: string): Observable<CurrentUser> {
    return of({ ...this.user, name });
  }

  church(): Observable<Church | null> {
    return of(this.storedChurch);
  }

  saveChurch(church: ChurchDetails): Observable<Church> {
    this.storedChurch = {
      ...church,
      province: 'ON',
      denomination: church.denomination ?? null,
      typicalAttendance: church.typicalAttendance ?? null,
    };
    return of(this.storedChurch);
  }

  contactPhone(): Observable<string | null> {
    return of(this.phone);
  }

  saveContactPhone(contactPhone: string): Observable<string | null> {
    this.phone = contactPhone;
    return of(contactPhone);
  }

  requestEmailChange(email: string): Observable<string> {
    return of(email.trim().toLowerCase());
  }

  confirmEmailChange(): Observable<string> {
    return of(this.user.email);
  }

  changePassword(): Observable<void> {
    return of(undefined);
  }

  sessions(): Observable<AccountSession[]> {
    return of(this.devices);
  }

  beginTwoFactor(): Observable<TwoFactorKey> {
    return of({
      key: 'JBSW Y3DP EHPK 3PXP',
      otpauthUri: 'otpauth://totp/Zamaro:naomi.fraser@riversidecc.ca?secret=JBSWY3DPEHPK3PXP',
    });
  }

  confirmTwoFactor(): Observable<string[]> {
    return of(RECOVERY_CODES);
  }

  turnOffTwoFactor(): Observable<void> {
    return of(undefined);
  }

  newRecoveryCodes(): Observable<string[]> {
    return of(RECOVERY_CODES);
  }

  endSession(id: string): Observable<void> {
    this.devices = this.devices.filter((session) => session.id !== id);
    return of(undefined);
  }
}
