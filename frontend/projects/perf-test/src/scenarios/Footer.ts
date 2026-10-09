import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Footer, type FooterColumn } from 'components';

/** The signed-in booker's footer (docs/mocks/pages/discover/default.html). */
@Component({
  selector: 'zm-footer-scenario',
  imports: [Footer],
  template: `<zm-footer
    word="Zamaro"
    tagline="Worship artists for churches around Toronto."
    [columns]="columns"
  />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class FooterScenario {
  protected readonly columns: FooterColumn[] = [
    {
      heading: 'Churches',
      items: [
        { label: 'Find who’s free', link: '/' },
        { label: 'Your bookings', link: '/bookings' },
        { label: 'How booking works', link: '/', fragment: 'how' },
        { label: 'hello@zamaro.ca', href: 'mailto:hello@zamaro.ca' },
      ],
    },
    {
      heading: 'Artists',
      items: [
        { label: 'Join the lineup', link: '/apply' },
        { label: 'What artists earn', link: '/', fragment: 'how' },
      ],
    },
    {
      heading: 'Naomi Fraser',
      items: [
        { label: 'Riverside Community Church' },
        { label: 'Saved artists (3)', link: '/saved' },
      ],
    },
  ];
}
