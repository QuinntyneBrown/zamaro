import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
} from '@angular/core';

/**
 * A page that cannot be shown, printed like a cancelled gig poster
 * (docs/design-system/components/error-page): the status in plain words, the poster words, a lead
 * that says whose fault it is, then the optional receipt (`[slot=details]`), recovery buttons
 * (`[slot=actions]`) and note (`[slot=note]`). With `heading`, the poster words become decoration and
 * the heading is the page's `h1` (the missing-artist 404). The page keeps the top bar and footer.
 */
@Component({
  selector: 'zm-error-page',
  template: `<div class="container error-page">
    <p class="overline">{{ overline() }}</p>
    @if (heading()) {
      <p class="error-poster" aria-hidden="true">
        @if (strike()) {
          <span class="strike">{{ strike() }}</span>
        }
        {{ poster() }}
      </p>
      <h1 class="page-head__title" tabindex="-1" [id]="headingId()">{{ heading() }}</h1>
    } @else {
      <h1
        class="error-poster"
        tabindex="-1"
        [id]="headingId()"
        [attr.aria-label]="posterSuffix() ? poster() + posterSuffix() : null"
      >
        @if (strike()) {
          <span class="strike" aria-hidden="true">{{ strike() }}</span>
        }
        {{ poster() }}
      </h1>
    }
    <p class="lead">{{ lead() }}</p>
    <div class="error-page__details"><ng-content select="[slot=details]" /></div>
    <div class="cluster"><ng-content select="[slot=actions]" /></div>
    <p class="text-muted"><ng-content select="[slot=note]" /></p>
  </div>`,
  styles: `
    :host {
      display: block;
    }

    .error-page {
      display: grid;
      gap: var(--space-6);
      justify-items: start;
      padding-block: var(--space-16) var(--space-20);
    }

    .overline {
      font: var(--text-overline);
      letter-spacing: var(--letter-spacing-stamp);
      text-transform: uppercase;
    }

    .error-poster {
      font: var(--text-display);
      text-transform: uppercase;
      color: inherit;
      overflow-wrap: anywhere;
    }

    .strike {
      text-decoration: line-through;
      text-decoration-thickness: 0.08em;
      text-decoration-color: var(--color-danger-solid);
    }

    .page-head__title {
      font: var(--text-h1);
      text-transform: uppercase;
    }

    .lead {
      font: var(--text-body-lg);
    }

    .error-page__details {
      width: 100%;
      max-width: var(--layout-auth-width);
    }

    .text-muted {
      color: var(--color-fg-muted);
    }

    .error-page__details:empty,
    .cluster:empty,
    .text-muted:empty {
      display: none;
    }

    @media (forced-colors: active) {
      .strike {
        text-decoration-color: CanvasText;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorPage {
  /** The status in plain words: "Error 404 · Page not found". */
  readonly overline = input.required<string>();
  /** The display words, six letters or fewer each: "No show", "Dead air". */
  readonly poster = input.required<string>();
  /**
   * Read after the poster words, not shown: ": page not found". It names the `h1` with the words, as
   * a visually hidden span would put a separator before it ("No show : page not found").
   */
  readonly posterSuffix = input<string>();
  /** A struck word before the poster words, hidden from assistive technology. */
  readonly strike = input<string>();
  /** Makes the poster decoration and this the `h1`: "This artist isn’t on Zamaro". */
  readonly heading = input<string>();
  readonly lead = input.required<string>();
  readonly headingId = input('error-title');
  /** Focuses the `h1` after the first render, when the error replaces content in an open page. */
  readonly autoFocus = input(false, { transform: booleanAttribute });

  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef);
    afterNextRender(() => {
      if (this.autoFocus()) host.nativeElement.querySelector<HTMLElement>('h1')?.focus();
    });
  }
}
