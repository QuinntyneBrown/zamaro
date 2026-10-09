import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';

/**
 * The first focusable element: hidden until focused, it moves focus to the main region (L2-101.1).
 * Focus is moved by hand because `<base href="/">` would turn `#main` into a navigation to `/#main`.
 */
@Component({
  selector: 'zm-skip-link',
  template: `<a class="skip-link" [href]="'#' + target()" (click)="skip($event)"
    ><ng-content
  /></a>`,
  styles: `
    .skip-link {
      position: absolute;
      left: var(--space-3);
      top: -10rem;
      z-index: var(--z-tooltip);
      padding: var(--space-3) var(--space-4);
      background: var(--color-accent);
      color: var(--color-fg-on-accent);
      font: var(--text-label);
      text-transform: uppercase;
      letter-spacing: var(--letter-spacing-wide);
      border: var(--border-width-thick) solid var(--color-border-on-accent);
      text-decoration: none;
    }

    .skip-link:focus-visible {
      top: var(--space-3);
    }

    .skip-link:hover {
      background: var(--color-accent-hover);
      color: var(--color-fg-on-accent);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkipLink {
  /** Id of the element that receives focus; it needs `tabindex="-1"`. */
  readonly target = input('main');

  private readonly document = inject(DOCUMENT);

  protected skip(event: Event): void {
    const target = this.document.getElementById(this.target());
    if (!target) {
      return;
    }
    event.preventDefault();
    target.focus();
    target.scrollIntoView();
  }
}
