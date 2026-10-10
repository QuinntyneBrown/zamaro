import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Footer, type FooterColumn, TopBar, type TopBarLink } from 'components';

/** Composite: the page chrome under `data-theme="dark"`, where every token resolves to its dark value. */
@Component({
  selector: 'zm-dark-theme-scenario',
  imports: [Footer, TopBar],
  template: `<div data-theme="dark">
    <zm-top-bar
      brand="Zamaro"
      navLabel="Primary"
      [links]="links"
      menuLabel="Open menu"
      themeLabel="Dark theme"
      [themePressed]="true"
    />
    <zm-footer
      word="Zamaro"
      tagline="Worship artists for churches around Toronto."
      [columns]="columns"
    />
  </div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DarkThemeScenario {
  protected readonly links: TopBarLink[] = [
    { label: 'Discover', link: '/' },
    { label: 'How booking works', link: '/', fragment: 'how' },
    { label: 'For artists', link: '/', fragment: 'join' },
  ];

  protected readonly columns: FooterColumn[] = [
    {
      heading: 'Churches',
      items: [
        { label: 'Find who’s free', link: '/' },
        { label: 'How booking works', link: '/', fragment: 'how' },
        { label: 'hello@zamaro.ca', href: 'mailto:hello@zamaro.ca' },
      ],
    },
    { heading: 'Artists', items: [{ label: 'What artists earn', link: '/', fragment: 'how' }] },
  ];
}
