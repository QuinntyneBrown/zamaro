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
import { AuthService, safeReturnUrl } from 'api';
import { Alert, BookingForm, Button, ButtonLink, Icon, Stamp } from 'components';
import { timer } from 'rxjs';
import { PageMeta } from '../../shared/page-meta';
import { VerifiedNotice } from '../../shared/verified-notice';

type Status = 'checking' | 'error' | 'expired';

/** How long "Sent" stays before another link can be asked for. */
const SENT_FOR_MS = 60_000;

/**
 * The verification link's page (docs/mocks/pages/verify-email, L2-022.3). The link's token is
 * checked once the browser has taken over, never during the server render, so a link preview or a
 * crawler cannot use it up. On success the page returns to the link's `returnUrl`, where "Email
 * verified" thanks the person; a used, old or unknown link has expired and offers a new one.
 */
@Component({
  selector: 'zm-verify-email-page',
  imports: [Alert, BookingForm, Button, ButtonLink, Icon, Stamp, TranslocoPipe],
  templateUrl: './verify-email.html',
  styleUrls: ['../sign-in/sign-in.scss', './verify-email.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerifyEmail {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notice = inject(VerifiedNotice);
  private readonly destroyRef = inject(DestroyRef);

  private readonly query = inject(ActivatedRoute).snapshot.queryParamMap;
  private readonly token = this.query.get('token') ?? '';
  private readonly returnUrl = safeReturnUrl(this.query.get('returnUrl'));

  protected readonly status = signal<Status>('checking');
  protected readonly retrying = signal(false);
  protected readonly sending = signal(false);
  protected readonly sent = signal(false);
  /** The address being confirmed, when the person is signed in on this browser. */
  protected readonly email = computed(() => this.auth.currentUser()?.email ?? null);

  constructor() {
    inject(PageMeta).set({
      title: inject(TranslocoService).translate('accounts.verifyEmail.pageTitle'),
      index: false,
    });
    afterNextRender(() => this.check());
  }

  protected tryAgain(): void {
    this.retrying.set(true);
    this.check();
  }

  /** A new link for this link's owner (or the signed-in booker), which revokes the earlier ones. */
  protected sendNewLink(): void {
    if (this.sending() || this.sent()) return;
    this.sending.set(true);
    this.auth
      .resendVerification({ token: this.token || undefined, returnUrl: this.returnUrl })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.sending.set(false);
          this.sent.set(true);
          timer(SENT_FOR_MS)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => this.sent.set(false));
        },
        error: () => this.sending.set(false),
      });
  }

  private check(): void {
    if (!this.token) {
      this.status.set('expired');
      return;
    }
    this.auth
      .verifyEmail(this.token)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ name }) => {
          this.notice.show(name);
          void this.router.navigateByUrl(this.returnUrl);
        },
        error: (error: unknown) => {
          this.retrying.set(false);
          const expired =
            error instanceof HttpErrorResponse && (error.status === 410 || error.status === 422);
          this.status.set(expired ? 'expired' : 'error');
        },
      });
  }
}
