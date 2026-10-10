import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Rating, Review } from 'components';

/** The profile's "What churches say": the summary rating and Abigail's four newest reviews. */
@Component({
  selector: 'zm-review-list-scenario',
  imports: [Rating, Review],
  template: `<p>
      <zm-rating
        variant="summary"
        [score]="4.9"
        label="Rated 4.9 out of 5 by 38 churches"
        countText="38 churches"
      />
    </p>
    <ul class="reviews" role="list">
      @for (review of reviews; track review.reviewer) {
        <li>
          <zm-review
            [quote]="review.quote"
            [stars]="review.stars"
            [starsLabel]="review.stars + ' out of 5 stars'"
            [reviewer]="review.reviewer"
            [source]="review.source"
            [reply]="review.reply"
            [replyMeta]="review.replyMeta"
          />
        </li>
      }
    </ul>`,
  styles: `
    .reviews {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: var(--space-6);
      list-style: none;
      padding: 0;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ReviewListScenario {
  protected readonly reviews = [
    {
      quote: 'She had the whole congregation singing in three-part harmony by the last verse.',
      stars: 5,
      reviewer: 'Rev. Janet Clarke',
      source: 'St. Brendan’s Anglican, Oshawa · September 2026',
      reply: null,
      replyMeta: '',
    },
    {
      quote:
        'She rehearsed with our volunteer band on Saturday and made them sound like pros on Sunday.',
      stars: 5,
      reviewer: 'Tomi Oduya',
      source: 'Harvest Point Church, Milton · August 2026',
      reply:
        'Thank you, Tomi! Your volunteers were ready for everything I threw at them. See you on Sun 1 Nov.',
      replyMeta: 'Reply from Abigail Mensah · October 2026',
    },
    {
      quote:
        'Our seniors asked for hymns and our youth asked for Jireh. She gave both, and somehow it felt like one service.',
      stars: 5,
      reviewer: 'Naomi Fraser',
      source: 'Riverside Community Church, Burlington · June 2026',
      reply: 'Riverside, you sang the roof off. Thank you for having me.',
      replyMeta: 'Reply from Abigail Mensah · June 2026',
    },
    {
      quote: 'Wonderful voice and a real pastor’s heart. Gracious about our tiny sound desk.',
      stars: 4,
      reviewer: 'Pastor Femi Adebayo',
      source: 'Living Waters Fellowship, Brampton · May 2026',
      reply: null,
      replyMeta: '',
    },
  ];
}
