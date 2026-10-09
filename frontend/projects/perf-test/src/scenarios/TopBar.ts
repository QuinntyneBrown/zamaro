import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TopBar, type TopBarLink } from 'components';

/** The guest header on Discover (docs/mocks/pages/discover/default.html). */
@Component({
  selector: 'zm-top-bar-scenario',
  imports: [TopBar],
  template: `<zm-top-bar brand="Zamaro" navLabel="Primary" [links]="links" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TopBarScenario {
  protected readonly links: TopBarLink[] = [
    { label: 'Discover', link: '/' },
    { label: 'How booking works', link: '/', fragment: 'how' },
    { label: 'For artists', link: '/', fragment: 'join' },
  ];
}
