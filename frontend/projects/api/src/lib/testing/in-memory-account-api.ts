import { type Observable, of } from 'rxjs';
import type { Church, ChurchDetails, CurrentUser } from '../models/accounts';
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

/** In-memory AccountApi for scenarios and component tests: it keeps what it is given. */
export class InMemoryAccountApi implements AccountApi {
  constructor(
    private readonly user: CurrentUser,
    private storedChurch: Church | null = RIVERSIDE,
    private phone: string | null = null,
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
}
