import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { DescriptionList, type DescriptionItem, type StepItem, Steps } from 'components';

/**
 * "How booking works" (docs/mocks/pages/discover, `#how`): the three steps and the full
 * cancellation policy (`#policy`), which every "Cancel free up to 14 days before" link opens
 * (L2-044.1). The same in every Discover state.
 */
@Component({
  selector: 'zm-how-booking-works',
  imports: [DescriptionList, Steps, TranslocoPipe],
  template: `<section id="how" class="section" aria-labelledby="how-title">
    <div class="container stack stack--lg">
      <div class="section__head">
        <div>
          <p class="section__kicker">{{ 'discover.how.kicker' | transloco }}</p>
          <h2 id="how-title">{{ 'discover.how.title' | transloco }}</h2>
        </div>
        <p class="text-muted">{{ 'discover.how.note' | transloco }}</p>
      </div>
      <zm-steps [items]="steps" />
      <section id="policy" class="stack" aria-labelledby="policy-title">
        <h3 id="policy-title">{{ 'discover.policy.title' | transloco }}</h3>
        <zm-description-list [items]="policy" [columns]="2" />
      </section>
    </div>
  </section>`,
  styles: `
    .stack--lg {
      gap: var(--space-8);
    }

    .section__head {
      display: flex;
      flex-wrap: wrap;
      align-items: end;
      justify-content: space-between;
      gap: var(--space-4) var(--space-8);
    }

    .section__kicker {
      display: inline-block;
      margin-bottom: var(--space-2);
      font: var(--text-overline);
      letter-spacing: var(--letter-spacing-stamp);
      text-transform: uppercase;
    }

    .text-muted {
      color: var(--color-fg-muted);
    }

    h3 {
      font: var(--text-h3);
      text-transform: uppercase;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HowBookingWorks {
  private readonly transloco = inject(TranslocoService);

  protected readonly steps: StepItem[] = [1, 2, 3].map((step) => ({
    title: this.t(`discover.how.step${step}.title`),
    description: this.t(`discover.how.step${step}.body`),
  }));

  protected readonly policy: DescriptionItem[] = ['early', 'late', 'artist'].map((id) => ({
    id,
    term: this.t(`discover.policy.${id}.term`),
    value: this.t(`discover.policy.${id}.detail`),
  }));

  private t(key: string): string {
    return this.transloco.translate(key);
  }
}
