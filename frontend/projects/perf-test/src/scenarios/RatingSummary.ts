import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Rating } from 'components';

/** Abigail's rating at the head of "What churches say": "★★★★★ 4.9 · 38 churches". */
@Component({
  selector: 'zm-rating-summary-scenario',
  imports: [Rating],
  template: `<zm-rating
    variant="summary"
    [score]="4.9"
    label="Rated 4.9 out of 5 by 38 churches"
    countText="38 churches"
  />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class RatingSummaryScenario {}
