import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * The tour-poster hero on the charcoal stage (docs/design-system/components/poster): kicker, the
 * headline with the date set huge, a subtitle, and projected content (the booking form) beside it
 * from LG.
 */
@Component({
  selector: 'zm-poster',
  template: `<section class="poster on-stage" [attr.aria-labelledby]="headingId()">
    <div class="container poster__grid">
      <div class="stack">
        <p class="overline poster__kicker">{{ kicker() }}</p>
        <h1 class="poster__title" [id]="headingId()">
          {{ heading() }}
          <span class="poster__date">
            @for (word of dateWords(); track $index; let last = $last) {
              <span>{{ word }}</span
              >{{ last ? '' : ' ' }}
            }
          </span>
        </h1>
        <p class="poster__sub">{{ subtitle() }}</p>
      </div>
      <ng-content />
    </div>
  </section>`,
  styleUrl: './poster-frame.scss',
  styles: `
    .poster__title {
      font: var(--text-h1);
      text-transform: uppercase;
    }

    .poster__date {
      display: flex;
      flex-wrap: wrap;
      column-gap: 0.18em;
      font: var(--text-display);
      text-transform: uppercase;
      color: var(--color-accent-on-stage);
    }

    .poster__date span {
      white-space: nowrap;
    }

    .poster__sub {
      color: var(--color-fg-on-stage-muted);
      font: var(--text-body-lg);
    }

    .poster__grid {
      display: grid;
      gap: var(--space-10);
    }

    @media (min-width: 62rem) {
      .poster__grid {
        grid-template-columns: 1.15fr 1fr;
        align-items: end;
        gap: var(--space-16);
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Poster {
  readonly kicker = input.required<string>();
  /** "Who’s free". */
  readonly heading = input.required<string>();
  /** Set huge and kept together word by word: "Sat 14 Nov", or "Pick a date" before a search. */
  readonly date = input.required<string>();
  readonly subtitle = input.required<string>();
  readonly headingId = input('hero-title');

  /** The first word, then the rest, each kept on one line ("Sat" / "14 Nov"). */
  protected readonly dateWords = computed(() => {
    const [first, ...rest] = this.date().split(' ');
    return rest.length ? [first, rest.join(' ')] : [first];
  });
}
