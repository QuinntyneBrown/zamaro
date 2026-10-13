import { inject } from '@angular/core';
import type { CanMatchFn } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from './auth.service';

/**
 * The admin application's root route matches only for a signed-in administrator; anyone else falls
 * through to the not-found route, so the admin area reveals nothing (L2-066.1). The web server has
 * already answered 404 to everyone else (ADR-0023); this is defence in depth.
 */
export const adminGuard: CanMatchFn = () =>
  inject(AuthService)
    .whenKnown()
    .pipe(map((user) => user?.roles.includes('admin') ?? false));
