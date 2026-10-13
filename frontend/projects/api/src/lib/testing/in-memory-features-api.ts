import { type Observable, of } from 'rxjs';
import type { FeatureFlagValues, FeaturesApi } from '../services/features';

/** In-memory FeaturesApi for scenarios and component tests: every flag off unless given. */
export class InMemoryFeaturesApi implements FeaturesApi {
  constructor(private readonly values: Partial<FeatureFlagValues> = {}) {}

  get(): Observable<FeatureFlagValues> {
    return of({ bookingRequests: false, ...this.values });
  }
}
