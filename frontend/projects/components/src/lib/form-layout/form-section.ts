import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * A titled panel of related fields in a long form (docs/specs/components/form-layout): a region named
 * by its `h2` (or `h3`) title, an optional lead under it and the body. An `id` set on the host, the
 * settings nav's target, stays on the host (D-8).
 */
@Component({
  selector: 'zm-form-section',
  host: {
    class: 'form-section',
    role: 'region',
    '[class.form-section--danger]': 'danger()',
    '[attr.aria-labelledby]': 'headingId()',
  },
  template: `@switch (headingLevel()) {
      @case (3) {
        <h3 class="form-section__title" [id]="headingId()">{{ heading() }}</h3>
      }
      @default {
        <h2 class="form-section__title" [id]="headingId()">{{ heading() }}</h2>
      }
    }
    <p class="form-section__lead"><ng-content select="[slot=lead]" /></p>
    <ng-content />`,
  styles: `
    :host {
      display: grid;
      gap: var(--space-5);
      padding: var(--space-6);
      background: var(--color-bg-surface);
      border: var(--border-width-thick) solid var(--color-border-strong);
      min-width: 0;
    }

    .form-section__title {
      font: var(--text-h3);
      text-transform: uppercase;
      padding-bottom: var(--space-3);
      border-bottom: var(--border-width-thick) dashed var(--color-border-strong);
    }

    .form-section__lead {
      color: var(--color-fg-muted);
    }

    .form-section__lead:empty {
      display: none;
    }

    :host(.form-section--danger) {
      border-color: var(--color-danger-border);
    }

    :host(.form-section--danger) .form-section__title {
      border-bottom-color: var(--color-danger-border);
    }

    @media (forced-colors: active) {
      :host,
      .form-section__title {
        border-color: CanvasText;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormSection {
  /** The title: "Church", "Your event". */
  readonly heading = input.required<string>();
  /** The title's `id`, which names the region. */
  readonly headingId = input.required<string>();
  /** 2 under the page's `h1`; 3 in a dialog or under another heading. */
  readonly headingLevel = input<2 | 3>(2);
  /** One irreversible action at the end of a settings page. */
  readonly danger = input(false, { transform: booleanAttribute });
}
