import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Radio, RadioGroup } from 'components';

/** Naomi's rating (docs/mocks/dialogs/write-review/default.html): five stub cards in a row, five stars chosen. */
@Component({
  selector: 'zm-star-rating-scenario',
  imports: [FormsModule, Radio, RadioGroup],
  template: `<zm-radio-group
    legend="Your rating"
    name="stars"
    variant="stub"
    layout="inline"
    requiredMarker="(required)"
    [ngModel]="'5'"
  >
    @for (score of scores; track score.value) {
      <zm-radio [value]="score.value" [description]="score.word"
        ><span aria-hidden="true">{{ score.stars }}</span
        ><span class="visually-hidden">{{ score.value }} out of 5 stars</span></zm-radio
      >
    }
  </zm-radio-group>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class StarRatingScenario {
  protected readonly scores = [
    { value: '5', stars: '★★★★★', word: 'Unforgettable' },
    { value: '4', stars: '★★★★', word: 'Great' },
    { value: '3', stars: '★★★', word: 'Good' },
    { value: '2', stars: '★★', word: 'Fair' },
    { value: '1', stars: '★', word: 'Poor' },
  ];
}
