import { HttpErrorResponse } from '@angular/common/http';
import { DOCUMENT } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  Injector,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import {
  AuthService,
  CONSENT_API,
  type CurrentLegalDocuments,
  FormatService,
  safeReturnUrl,
} from 'api';
import { Alert, BookingForm, Button, Icon, Skeleton } from 'components';
import { PageMeta } from '../../shared/page-meta';

type Status = 'loading' | 'ready' | 'accepting' | 'error';

/**
 * The terms gate at `/account/accept-terms` (docs/mocks/pages/accept-terms, L2-080.3): what changed
 * in the current terms, then Accept and continue, which records the version shown and goes on to the
 * page the person was opening. Sign out is the only other way out. A version that changed meanwhile
 * reloads the page with the new one.
 */
@Component({
  selector: 'zm-accept-terms-page',
  imports: [Alert, BookingForm, Button, Icon, Skeleton, TranslocoPipe],
  templateUrl: './accept-terms.html',
  styleUrls: ['../sign-in/sign-in.scss', './accept-terms.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AcceptTerms {
  private readonly consent = inject(CONSENT_API);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly format = inject(FormatService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly document = inject(DOCUMENT);
  private readonly returnUrl = safeReturnUrl(
    inject(ActivatedRoute).snapshot.queryParamMap.get('returnUrl'),
  );

  protected readonly status = signal<Status>('loading');
  protected readonly documents = signal<CurrentLegalDocuments | null>(null);
  protected readonly busy = computed(() => this.status() === 'accepting');
  /** "Thu 8 Oct 2026". */
  protected readonly effectiveFrom = computed(() => {
    const terms = this.documents()?.terms;
    return terms ? this.format.shortDateWithYear(terms.effectiveFrom) : '';
  });

  constructor() {
    inject(PageMeta).set({
      title: inject(TranslocoService).translate('accounts.acceptTerms.pageTitle'),
      index: false,
    });
    this.load();
  }

  protected accept(): void {
    const terms = this.documents()?.terms;
    if (this.busy() || !terms) return;
    this.status.set('accepting');
    this.consent
      .acceptTerms(terms.version)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (user) => {
          this.auth.replace(user);
          void this.router.navigateByUrl(this.returnUrl);
        },
        error: (error: unknown) => {
          // A newer version took effect meanwhile: show it, and record it next time.
          if (error instanceof HttpErrorResponse && error.status === 409) this.load();
          else this.status.set('error');
        },
      });
  }

  protected signOut(): void {
    this.auth.signOut().subscribe({ next: () => void this.router.navigateByUrl('/') });
  }

  private load(): void {
    this.status.set('loading');
    this.consent
      .currentDocuments()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (documents) => {
          this.documents.set(documents);
          this.status.set('ready');
          // Focus starts on Accept and continue, as the mock has it.
          afterNextRender(
            () => this.document.getElementById('accept-terms')?.querySelector('button')?.focus(),
            { injector: this.injector },
          );
        },
        error: () => this.status.set('error'),
      });
  }
}
