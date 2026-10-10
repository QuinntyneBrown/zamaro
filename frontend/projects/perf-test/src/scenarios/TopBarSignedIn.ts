import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TopBar, type TopBarAccount, type TopBarLink } from 'components';

/** Naomi Fraser's header on Discover, signed in (docs/mocks/pages/discover/default.html). */
@Component({
  selector: 'zm-top-bar-signed-in-scenario',
  imports: [TopBar],
  template: `<zm-top-bar
    brand="Zamaro"
    navLabel="Primary"
    [links]="links"
    menuLabel="Open menu"
    themeLabel="Dark theme"
    [account]="account"
    accountControls="account-menu"
  />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TopBarSignedInScenario {
  protected readonly links: TopBarLink[] = [
    { label: 'Discover', link: '/' },
    { label: 'How booking works', link: '/', fragment: 'how' },
    { label: 'For artists', link: '/', fragment: 'join' },
  ];
  protected readonly account: TopBarAccount = {
    name: 'Naomi Fraser',
    label: 'Account menu for Naomi Fraser',
  };
}
