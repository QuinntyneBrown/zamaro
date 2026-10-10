import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Button, Review } from 'components';

/** Tomi Oduya's review with Abigail's reply and a ghost Report in the actions (review CRD). */
@Component({
  selector: 'zm-review-scenario',
  imports: [Button, Review],
  template: `<zm-review
    quote="She rehearsed with our volunteer band on Saturday and made them sound like pros on Sunday."
    [stars]="5"
    starsLabel="5 out of 5 stars"
    reviewer="Tomi Oduya"
    source="Harvest Point Church, Milton · August 2026"
    reply="Thank you, Tomi! Your volunteers were ready for everything I threw at them. See you on Sun 1 Nov."
    replyMeta="Reply from Abigail Mensah · October 2026"
  >
    <zm-button slot="actions" variant="ghost"
      >Report<span class="visually-hidden"> Tomi Oduya’s review</span></zm-button
    >
  </zm-review>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ReviewScenario {}
