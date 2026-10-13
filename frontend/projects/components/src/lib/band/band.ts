import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * A call to action on yellow (docs/design-system/components/band): an overline, a big headline and
 * the terms, with one action beside them. The page owns the `<section>` and labels it with
 * `headingId`; project the body as content and the action into `[slot=action]`. Buttons inside
 * take the stage skin from the button's own styles.
 */
@Component({
  selector: 'zm-band',
  host: { class: 'band' },
  template: `<div class="stack">
      <p class="overline">{{ kicker() }}</p>
      <h2 [id]="headingId()">{{ title() }}</h2>
      <ng-content />
    </div>
    <ng-content select="[slot=action]" />`,
  styles: `
    :host {
      display: grid;
      align-items: center;
      gap: var(--space-6);
      padding: var(--space-10) var(--space-8);
      color: var(--color-fg-on-accent);
      background: var(--color-accent);
      border: var(--border-width-poster) solid var(--color-border-on-accent);
    }

    .overline {
      font: var(--text-overline);
      letter-spacing: var(--letter-spacing-stamp);
      text-transform: uppercase;
    }

    h2 {
      font: var(--text-h1);
      text-transform: uppercase;
      text-wrap: balance;
      overflow-wrap: break-word;
    }

    @media (min-width: 62rem) {
      :host {
        grid-template-columns: minmax(0, 1fr) auto;
        gap: var(--space-10);
        padding: var(--space-12);
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Band {
  /** The audience: "For artists". */
  readonly kicker = input.required<string>();
  /** "Lead worship? Get on the bill." */
  readonly title = input.required<string>();
  readonly headingId = input.required<string>();
}
