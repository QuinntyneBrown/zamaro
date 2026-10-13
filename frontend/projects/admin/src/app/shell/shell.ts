import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  Injector,
  signal,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { translateSignal, TranslocoPipe } from '@jsverse/transloco';
import { ADMIN_OVERVIEW_API, type AdminOverview, AuthService, ThemeService } from 'api';
import {
  Footer,
  type FooterColumn,
  SkipLink,
  ToastRegion,
  TopBar,
  type TopBarAccount,
  type TopBarLink,
} from 'components';

const CONTACT_EMAIL = 'hello@zamaro.ca';

/**
 * The admin workspace around every admin screen (docs/mocks/pages/admin-*, secure-admin-access): the
 * workspace top bar with the "Admin" role tag and the sections built so far with their counts (M3
 * D17), the routed main region, the footer and the toast region. The browser asks who is signed in
 * once it has taken over; the web server only serves this application to an administrator.
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
  private readonly overviewApi = inject(ADMIN_OVERVIEW_API);
  private readonly document = inject(DOCUMENT);

  /** The counts beside the sections; refreshed on every load, not polled (M3 D9). */
  protected readonly overview = signal<AdminOverview | null>(null);

  constructor() {
    afterNextRender(() => {
      this.auth.load();
      this.overviewApi.overview().subscribe({
        next: (counts) => this.overview.set(counts),
        error: () => undefined,
      });
    });
  }

  private readonly role = translateSignal('admin.role');
  private readonly applications = translateSignal('admin.nav.applications');
  private readonly artists = translateSignal('admin.nav.artists');
  private readonly auditLog = translateSignal('admin.nav.auditLog');
  private readonly adminHeading = translateSignal('admin.footer.admin');
  private readonly records = translateSignal('admin.footer.records');
  private readonly team = translateSignal('admin.footer.team');
  private readonly accountLabel = translateSignal(
    'common.account.open',
    computed(() => ({ name: this.auth.currentUser()?.name ?? '' })),
  );

  protected readonly roleTag = computed(() => this.role());

  /** Applications, Artists and Audit log: the sections built in M3 (D17). */
  protected readonly links = computed<TopBarLink[]>(() => [
    { label: this.applications(), link: '/applications' },
    { label: this.artists(), link: '/artists' },
    { label: this.auditLog(), link: '/audit' },
  ]);

  protected readonly account = computed<TopBarAccount | null>(() => {
    const user = this.auth.currentUser();
    return user ? { name: user.name, label: this.accountLabel() } : null;
  });

  protected readonly footerColumns = computed<FooterColumn[]>(() => {
    const user = this.auth.currentUser();
    return [
      {
        heading: this.adminHeading(),
        items: [
          { label: this.applications(), link: '/applications' },
          { label: this.artists(), link: '/artists' },
        ],
      },
      { heading: this.records(), items: [{ label: this.auditLog(), link: '/audit' }] },
      {
        heading: user?.name ?? '',
        items: [{ label: this.team() }, { label: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}` }],
      },
    ];
  });

  /** The drawer loads on first use, as in the public application. */
  protected async openMenu(): Promise<void> {
    const { openAdminMenuDialog } = await import('../dialogs/menu/menu');
    this.menuOpen.set(true);
    openAdminMenuDialog(this.injector, this.menuId, this.links()).closed.subscribe(() =>
      this.menuOpen.set(false),
    );
  }

  /** Sign out ends the session, then leaves the admin application for the public site. */
  protected async openAccountMenu(): Promise<void> {
    const user = this.auth.currentUser();
    if (!user) return;
    const { openAdminAccountMenuDialog } = await import('../dialogs/account-menu/account-menu');
    this.accountMenuOpen.set(true);
    openAdminAccountMenuDialog(this.injector, this.accountMenuId, user).closed.subscribe(
      (result) => {
        this.accountMenuOpen.set(false);
        if (result === 'sign-out') this.signOut();
      },
    );
  }

  private signOut(): void {
    this.auth.signOut().subscribe({
      next: () => this.document.location.assign('/'),
      error: () => undefined,
    });
  }
}
