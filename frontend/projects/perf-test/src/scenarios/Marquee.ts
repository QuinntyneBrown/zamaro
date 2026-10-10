import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Marquee } from 'components';

@Component({
  selector: 'zm-marquee-scenario',
  imports: [Marquee],
  template: `<zm-marquee [items]="cities" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class MarqueeScenario {
  protected readonly cities = [
    'Toronto',
    'Burlington',
    'Mississauga',
    'Brampton',
    'Hamilton',
    'Markham',
    'Ajax',
    'Oshawa',
    'Barrie',
    'Kitchener',
    'Niagara',
  ];
}
