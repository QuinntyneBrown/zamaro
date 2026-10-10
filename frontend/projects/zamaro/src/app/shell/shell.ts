import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  Injector,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { translateSignal, TranslocoPipe } from '@jsverse/transloco';
import { AuthService } from 'api';
import {
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
import { filter, map } from 'rxjs';
import { ThemeService } from './theme.service';

const CONTACT_EMAIL = 'hello@zamaro.ca';

/**
 * Skip link, header, the routed main region and footer on every page (L2-102.1), then the one
 * toast region, present from load so every toast is announced (L2-102). The server renders every
 * page signed out; once the browser has taken over it asks who is signed in, and the header and
 * footer switch to that person (ADR-0017).
 */
@Component({
  selector: 'zm-shell',
  imports: [Footer, RouterOutlet, SkipLink, ToastRegion, TopBar, TranslocoPipe],
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
  private readonly accountLabel = translateSignal(
    'common.account.open',
    computed(() => ({ name: this.auth.currentUser()?.name ?? '' })),
  );

  protected readonly account = computed<TopBarAccount | null>(() => {
    const user = this.auth.currentUser();
    return user ? { name: user.name, label: this.accountLabel() } : null;
  });

  /** "Sign in", back to this page afterwards. The sign-in page's own "Create account" joins in M2 S5. */
  protected readonly authLink = computed<TopBarAuth | null>(() => {
    const url = this.url();
    if (url.split(/[?#]/)[0] === '/sign-in') return null;
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
   * Signed out: Sign in (Create an account joins in M2 S5). Signed in: the person's name; their
   * church (S9) and Saved artists (S15) join it.
   */
  private accountColumn(): FooterColumn {
    const user = this.auth.currentUser();
    return user
      ? { heading: user.name, items: [] }
      : { heading: this.yourAccount(), items: [{ label: this.signIn(), link: '/sign-in' }] };
  }
}
