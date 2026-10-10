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
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { translateSignal, TranslocoPipe } from '@jsverse/transloco';
import { AuthService, safeReturnUrl } from 'api';
import {
  Banner,
  Footer,
  type FooterColumn,
  SkipLink,
  ToastRegion,
  ToastService,
  TopBar,
  type TopBarAccount,
  type TopBarAuth,
  type TopBarLink,
} from 'components';
import { filter, map, timer } from 'rxjs';
import { VerifiedNotice } from '../shared/verified-notice';
import { ThemeService } from './theme.service';

const CONTACT_EMAIL = 'hello@zamaro.ca';

/** How long "Sent" stays before another verification link can be asked for. */
const SENT_FOR_MS = 60_000;

/**
 * Skip link, header, the routed main region and footer on every page (L2-102.1), then the one
 * toast region, present from load so every toast is announced (L2-102). The server renders every
 * page signed out; once the browser has taken over it asks who is signed in, and the header and
 * footer switch to that person (ADR-0017). Under the top bar, a booker whose address is not verified
 * is asked to verify it on every page, and a verification link's page is followed by "Email
 * verified" (L2-022.3).
 */
@Component({
  selector: 'zm-shell',
  imports: [Banner, Footer, RouterOutlet, SkipLink, ToastRegion, TopBar, TranslocoPipe],
  templateUrl: './shell.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Shell {
  protected readonly theme = inject(ThemeService);
  protected readonly menuId = 'nav-drawer';
  protected readonly menuOpen = signal(false);
  protected readonly accountMenuId = 'account-menu';
  protected readonly accountMenuOpen = signal(false);

  private readonly injector = inject(Injector);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toasts = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly verified = inject(VerifiedNotice);
  protected readonly resending = signal(false);
  protected readonly resent = signal(false);

  /** The address to verify, while the signed-in person has not verified it. */
  protected readonly unverifiedEmail = computed(() => {
    const user = this.auth.currentUser();
    return user && !user.emailVerified ? user.email : null;
  });

  /** The address of the page on screen, for the Sign in link's way back. */
  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  constructor() {
    afterNextRender(() => this.auth.load());
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.verified.pageChanged());
  }

  /** "Resend email": a new link, which revokes the earlier ones; "Sent" for a minute. */
  protected resendVerification(): void {
    this.resending.set(true);
    this.auth
      .resendVerification()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.resending.set(false);
          this.resent.set(true);
          timer(SENT_FOR_MS)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => this.resent.set(false));
        },
        error: () => this.resending.set(false),
      });
  }

  /**
   * The drawer and the CDK overlay behind it load on first use: the menu only shows below LG and
   * only after a tap, so they stay out of every page's first download.
   */
  protected async openMenu(): Promise<void> {
    const { openMenuDialog } = await import('../dialogs/menu/menu');
    this.menuOpen.set(true);
    openMenuDialog(this.injector, this.menuId).closed.subscribe(() => this.menuOpen.set(false));
  }

  /** The account menu loads on first use too. Sign out ends the session, then the header changes. */
  protected async openAccountMenu(): Promise<void> {
    const user = this.auth.currentUser();
    if (!user) return;
    const { openAccountMenuDialog } = await import('../dialogs/account-menu/account-menu');
    this.accountMenuOpen.set(true);
    openAccountMenuDialog(this.injector, this.accountMenuId, user).closed.subscribe((result) => {
      this.accountMenuOpen.set(false);
      if (result === 'sign-out') this.signOut();
    });
  }

  private signOut(): void {
    // A refusal has already said so (the CSRF toast); the person simply stays signed in.
    this.auth.signOut().subscribe({ next: () => this.toasts.dismissAll(), error: () => undefined });
  }

  private readonly discover = translateSignal('common.nav.discover');
  private readonly how = translateSignal('common.nav.how');
  private readonly forArtists = translateSignal('common.nav.forArtists');
  private readonly churches = translateSignal('common.footer.churches');
  private readonly findWhosFree = translateSignal('common.footer.findWhosFree');
  private readonly artists = translateSignal('common.footer.artists');
  private readonly whatArtistsEarn = translateSignal('common.footer.whatArtistsEarn');
  private readonly yourAccount = translateSignal('common.footer.yourAccount');
  private readonly signIn = translateSignal('common.auth.signIn');
  private readonly createAccount = translateSignal('common.auth.createAccount');
  private readonly signUp = translateSignal('common.auth.signUp');
  private readonly footerCreateAccount = translateSignal('common.footer.createAccount');
  private readonly accountLabel = translateSignal(
    'common.account.open',
    computed(() => ({ name: this.auth.currentUser()?.name ?? '' })),
  );

  protected readonly account = computed<TopBarAccount | null>(() => {
    const user = this.auth.currentUser();
    return user ? { name: user.name, label: this.accountLabel() } : null;
  });

  /**
   * "Sign in", back to this page afterwards. On the sign-in page, "Create account" ("Sign up" below
   * 480 px) instead; between the two pages the way back is passed on, never the pages themselves.
   */
  protected readonly authLink = computed<TopBarAuth | null>(() => {
    const url = this.url();
    const [path, query = ''] = url.split('#')[0].split('?');
    const returnUrl = safeReturnUrl(new URLSearchParams(query).get('returnUrl'));
    const passedOn = returnUrl === '/' ? {} : { returnUrl };
    if (path === '/sign-in') {
      return {
        label: this.createAccount(),
        shortLabel: this.signUp(),
        link: '/sign-up',
        queryParams: passedOn,
      };
    }
    if (path === '/sign-up')
      return { label: this.signIn(), link: '/sign-in', queryParams: passedOn };
    return { label: this.signIn(), link: '/sign-in', queryParams: { returnUrl: url } };
  });

  protected readonly links = computed<TopBarLink[]>(() => [
    { label: this.discover(), link: '/' },
    { label: this.how(), link: '/', fragment: 'how' },
    { label: this.forArtists(), link: '/', fragment: 'join' },
  ]);

  // Links to screens built in later milestones join these columns when the screens exist.
  protected readonly footerColumns = computed<FooterColumn[]>(() => [
    {
      heading: this.churches(),
      items: [
        { label: this.findWhosFree(), link: '/' },
        { label: this.how(), link: '/', fragment: 'how' },
        { label: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}` },
      ],
    },
    {
      heading: this.artists(),
      items: [{ label: this.whatArtistsEarn(), link: '/', fragment: 'how' }],
    },
    this.accountColumn(),
  ]);

  /**
   * Signed out: Sign in and Create an account. Signed in: the person's name; their
   * church (S9) and Saved artists (S15) join it.
   */
  private accountColumn(): FooterColumn {
    const user = this.auth.currentUser();
    return user
      ? { heading: user.name, items: [] }
      : {
          heading: this.yourAccount(),
          items: [
            { label: this.signIn(), link: '/sign-in' },
            { label: this.footerCreateAccount(), link: '/sign-up' },
          ],
        };
  }
}
