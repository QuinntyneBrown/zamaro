import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Menu, type MenuItem, type MenuWho } from 'components';

/** Naomi Fraser's account menu (docs/mocks/dialogs/account-menu/default.html). */
@Component({
  selector: 'zm-menu-account-scenario',
  imports: [Menu],
  template: `<zm-menu [who]="who" whoId="account-who" [items]="items" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class MenuAccountScenario {
  protected readonly who: MenuWho = {
    name: 'Naomi Fraser',
    detail: 'Riverside Community Church',
    note: 'naomi.fraser@riversidecc.ca',
  };
  protected readonly items: MenuItem[] = [
    { kind: 'link', label: 'Account settings', icon: 'sliders', link: '/account' },
    { kind: 'separator' },
    { kind: 'action', id: 'sign-out', label: 'Sign out', icon: 'sign-out' },
  ];
}
