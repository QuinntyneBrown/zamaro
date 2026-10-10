import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** A decorative strip of words (docs/design-system/components/marquee). It never moves. */
@Component({
  selector: 'zm-marquee',
  host: { 'aria-hidden': 'true' },
  template: `@for (item of items(); track item; let last = $last) {
    <span>{{ item }}{{ last ? '' : ' ✦' }}</span>
  }`,
  styles: `
    :host {
      display: block;
      overflow: hidden;
      white-space: nowrap;
      padding-block: var(--space-3);
      font: var(--text-h4);
      line-height: 1;
      text-transform: uppercase;
      letter-spacing: var(--letter-spacing-wide);
      background: var(--color-accent);
      color: var(--color-fg-on-accent);
      border-block: var(--border-width-thick) solid var(--color-border-on-accent);
    }

    span {
      display: inline-block;
      padding-inline: var(--space-5);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Marquee {
  readonly items = input.required<readonly string[]>();
}
