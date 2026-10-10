import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Rating } from 'components';

@Component({
  selector: 'zm-rating-scenario',
  imports: [Rating],
  template: `<zm-rating
    [score]="4.6"
    label="Rated 4.6 out of 5 by 17 churches"
    countText="17 churches"
    newText="New"
  />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class RatingScenario {}
