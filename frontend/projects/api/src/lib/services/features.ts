import { HttpClient } from '@angular/common/http';
import { inject, Injectable, InjectionToken, signal } from '@angular/core';
import { map, type Observable } from 'rxjs';

/**
 * Unfinished features an environment turns on (ADR-0012). The API owns the switches; every flag
 * reads as off until the API says otherwise, and stays off if it cannot be reached.
 */
export interface FeatureFlagValues {
  /** Sending a booking request from the profile's booking stub (M5). */
  bookingRequests: boolean;
}

export type FeatureFlag = keyof FeatureFlagValues;

export interface FeaturesApi {
  get(): Observable<FeatureFlagValues>;
}

export const FEATURES_API = new InjectionToken<FeaturesApi>('FeaturesApi');

@Injectable()
export class HttpFeaturesApi implements FeaturesApi {
  private readonly http = inject(HttpClient);

  get(): Observable<FeatureFlagValues> {
    return this.http
      .get<{ data: FeatureFlagValues }>('/api/v1/features')
      .pipe(map((response) => response.data));
  }
}

const ALL_OFF: FeatureFlagValues = { bookingRequests: false };

/**
 * The flags as a signal, fetched once on first use. Fetched while rendering on the server, they
 * reach the browser in the transfer cache, so a hydrated page never flips a flag.
 */
@Injectable({ providedIn: 'root' })
export class FeatureFlags {
  private readonly values = signal<FeatureFlagValues>(ALL_OFF);

  constructor() {
    inject(FEATURES_API)
      .get()
      .subscribe({
        next: (values) => this.values.set({ ...ALL_OFF, ...values }),
        error: () => undefined,
      });
  }

  isOn(flag: FeatureFlag): boolean {
    return this.values()[flag];
  }
}
