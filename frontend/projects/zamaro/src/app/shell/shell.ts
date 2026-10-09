import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { translateSignal, TranslocoPipe } from '@jsverse/transloco';
import { Footer, type FooterColumn, SkipLink, TopBar, type TopBarLink } from 'components';

const CONTACT_EMAIL = 'hello@zamaro.ca';

/** Skip link, header, the routed main region and footer on every page (L2-102.1). */
@Component({
  selector: 'zm-shell',
  imports: [Footer, RouterOutlet, SkipLink, TopBar, TranslocoPipe],
  templateUrl: './shell.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Shell {
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
