import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Menu, type MenuItem } from 'components';

/** The navigation drawer's items (docs/mocks/dialogs/menu/default.html). */
@Component({
  selector: 'zm-menu-scenario',
  imports: [Menu],
  template: `<zm-menu [items]="items" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class MenuScenario {
  protected readonly items: MenuItem[] = [
    { kind: 'link', label: 'Discover', icon: 'compass', link: '/' },
    { kind: 'link', label: 'How booking works', icon: 'help', link: '/', fragment: 'how' },
    { kind: 'link', label: 'For artists', icon: 'mic', link: '/', fragment: 'join' },
    { kind: 'separator' },
    { kind: 'toggle', id: 'theme', label: 'Dark theme', icon: 'moon', pressed: false },
  ];
}
