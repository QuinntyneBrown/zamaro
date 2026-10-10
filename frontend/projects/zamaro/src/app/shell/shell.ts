import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  Injector,
  signal,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { translateSignal, TranslocoPipe } from '@jsverse/transloco';
import { Footer, type FooterColumn, SkipLink, TopBar, type TopBarLink } from 'components';
import { ThemeService } from './theme.service';

const CONTACT_EMAIL = 'hello@zamaro.ca';

/** Skip link, header, the routed main region and footer on every page (L2-102.1). */
@Component({
  selector: 'zm-shell',
  imports: [Footer, RouterOutlet, SkipLink, TopBar, TranslocoPipe],
  templateUrl: './shell.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Shell {
  protected readonly theme = inject(ThemeService);
  protected readonly menuId = 'nav-drawer';
  protected readonly menuOpen = signal(false);

  private readonly injector = inject(Injector);

  /**
   * The drawer and the CDK overlay behind it load on first use: the menu only shows below LG and
   * only after a tap, so they stay out of every page's first download.
   */
  protected async openMenu(): Promise<void> {
    const { openMenuDialog } = await import('../dialogs/menu/menu');
    this.menuOpen.set(true);
    openMenuDialog(this.injector, this.menuId).closed.subscribe(() => this.menuOpen.set(false));
  }

  private readonly discover = translateSignal('common.nav.discover');
  private readonly how = translateSignal('common.nav.how');
  private readonly forArtists = translateSignal('common.nav.forArtists');
  private readonly churches = translateSignal('common.footer.churches');
  private readonly findWhosFree = translateSignal('common.footer.findWhosFree');
  private readonly artists = translateSignal('common.footer.artists');
  private readonly whatArtistsEarn = translateSignal('common.footer.whatArtistsEarn');

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
  ]);
}
