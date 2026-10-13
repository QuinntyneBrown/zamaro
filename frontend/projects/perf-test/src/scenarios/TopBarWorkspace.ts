import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TopBar, type TopBarAccount, type TopBarLink } from 'components';

/** Priya Nair's admin bar (docs/mocks/pages/admin-applications/default.html). */
@Component({
  selector: 'zm-top-bar-workspace-scenario',
  imports: [TopBar],
  template: `<zm-top-bar
    variant="workspace"
    brand="Zamaro"
    homeLink="/applications"
    role="Admin"
    navLabel="Primary"
    [links]="links"
    menuLabel="Open menu"
    themeLabel="Dark theme"
    [account]="account"
    accountControls="account-menu"
  />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TopBarWorkspaceScenario {
  protected readonly links: TopBarLink[] = [
    { label: 'Applications', link: '/applications', count: 3, countLabel: 'waiting' },
    { label: 'Artists', link: '/artists' },
    { label: 'Bookings', link: '/bookings', count: 1, countLabel: 'held' },
    { label: 'Reviews', link: '/reviews', count: 2, countLabel: 'reported' },
    { label: 'Audit log', link: '/audit' },
  ];
  protected readonly account: TopBarAccount = {
    name: 'Priya Nair',
    label: 'Account menu for Priya Nair',
  };
}
