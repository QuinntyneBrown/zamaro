import { HttpErrorResponse } from '@angular/common/http';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { ACCOUNT_API, AuthService } from 'api';
import { Alert, BookingForm, Button, ButtonLink, Icon, Stamp } from 'components';
import { EmailChangedNotice } from '../../shared/email-changed-notice';
import { PageMeta } from '../../shared/page-meta';

type Status = 'confirming' | 'error' | 'expired';

/**
 * The email change link's page (docs/mocks/pages/confirm-email, L2-025.1). The token is sent once the
 * browser has taken over, so a link preview cannot use it up. On success the account signs in with
 * the new address and the page goes to account settings, where "Email changed" says so; a used, old or
 * unknown link has expired and nothing changed.
 */
@Component({
  selector: 'zm-confirm-email-page',
  imports: [Alert, BookingForm, Button, ButtonLink, Icon, Stamp, TranslocoPipe],
  templateUrl: './confirm-email.html',
  styleUrls: ['../sign-in/sign-in.scss', '../verify-email/verify-email.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmEmail {
  private readonly api = inject(ACCOUNT_API);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notice = inject(EmailChangedNotice);
  private readonly destroyRef = inject(DestroyRef);
  private readonly token = inject(ActivatedRoute).snapshot.queryParamMap.get('token') ?? '';

  protected readonly status = signal<Status>('confirming');
  protected readonly retrying = signal(false);
  /** The address the account signs in with: from the expired answer, or the signed-in person. */
  private readonly expiredEmail = signal<string | null>(null);
  protected readonly currentEmail = computed(
    () => this.expiredEmail() ?? this.auth.currentUser()?.email ?? null,
  );
  /** The address being moved to, when the person is signed in on this browser. */
  protected readonly pendingEmail = computed(() => this.auth.currentUser()?.pendingEmail ?? null);

  constructor() {
    inject(PageMeta).set({
      title: inject(TranslocoService).translate('accounts.confirmEmail.pageTitle'),
      index: false,
    });
    afterNextRender(() => {
      this.auth.load();
      this.confirm();
    });
  }

  protected tryAgain(): void {
    this.retrying.set(true);
    this.confirm();
  }

  private confirm(): void {
    if (!this.token) {
      this.status.set('expired');
      return;
    }
    this.api
      .confirmEmailChange(this.token)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (email) => {
          this.notice.show(email);
          if (this.auth.currentUser()) this.auth.load();
          void this.router.navigateByUrl('/account');
        },
        error: (error: unknown) => {
          this.retrying.set(false);
          const expired =
            error instanceof HttpErrorResponse && (error.status === 410 || error.status === 422);
          if (expired) this.expiredEmail.set(error.error?.email ?? null);
          this.status.set(expired ? 'expired' : 'error');
        },
      });
  }
}
