import { HttpResponse, type HttpInterceptorFn } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { ADMIN_OVERVIEW_API } from 'api';
import { ToastService, type ToastRef } from 'components';
import { firstValueFrom, tap } from 'rxjs';

/** The API ends an administrator's session after 30 idle minutes; the warning comes 2 minutes before (L2-066.3). */
export const WARN_AFTER_MS = 28 * 60_000;

/**
 * Keeps the admin session's clock on this side (secure-admin-access). Every API answer is activity
 * and restarts the 28-minute timer; when it runs out, a persistent warning toast offers "Stay signed
 * in", which asks the API for the overview and so counts as activity there too. The toast never leaves
 * on its own (L2-109.4).
 */
@Injectable({ providedIn: 'root' })
export class IdleSession {
  private readonly toasts = inject(ToastService);
  private readonly transloco = inject(TranslocoService);
  private readonly overview = inject(ADMIN_OVERVIEW_API);
  private timer?: ReturnType<typeof setTimeout>;
  private warning?: ToastRef;

  /** An API answer arrived: the session is active now. */
  touch(): void {
    clearTimeout(this.timer);
    this.warning?.dismiss();
    this.warning = undefined;
    this.timer = setTimeout(() => this.warn(), WARN_AFTER_MS);
  }

  private warn(): void {
    const title = this.transloco.translate('admin.session.title');
    this.warning = this.toasts.show({
      variant: 'warning',
      persistent: true,
      kind: this.transloco.translate('admin.session.kind'),
      title,
      text: this.transloco.translate('admin.session.text'),
      dismissLabel: this.transloco.translate('common.toast.dismiss', { title }),
      key: 'idle-session',
      actions: [
        {
          label: this.transloco.translate('admin.session.stay'),
          run: () => firstValueFrom(this.overview.overview()),
        },
      ],
    });
  }
}

/** Every API answer restarts the idle timer, as it does on the API (EnforceAdminIdleTimeout). */
export const idleActivityInterceptor: HttpInterceptorFn = (request, next) => {
  const idle = inject(IdleSession);
  return next(request).pipe(
    tap((event) => {
      if (event instanceof HttpResponse && request.url.startsWith('/api/')) idle.touch();
    }),
  );
};
