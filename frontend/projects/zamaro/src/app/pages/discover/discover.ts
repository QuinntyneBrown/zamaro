import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

/** Discover at `/` (docs/mocks/pages/discover). The poster asks for a date until a search runs. */
@Component({
  selector: 'zm-discover',
  imports: [TranslocoPipe],
  template: `<section class="poster on-stage" aria-labelledby="hero-title">
    <div class="container">
      <h1 id="hero-title" class="poster__title">
        {{ 'discover.poster.title' | transloco }}
        <span class="poster__date">{{ 'discover.poster.noDate' | transloco }}</span>
      </h1>
    </div>
  </section>`,
  styles: `
    .poster {
      padding-block: var(--space-12) var(--space-16);
    }

    .poster__title {
      font: var(--text-h1);
      text-transform: uppercase;
    }

    .poster__date {
      display: block;
      font: var(--text-display);
      color: var(--color-accent-on-stage);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Discover {}
