import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  output,
} from '@angular/core';

export interface ErrorSummaryItem {
  /** The `id` of the control the message is about. */
  fieldId: string;
  message: string;
}

/**
 * What stopped a submit, at the top of the form (docs/specs/components/form-layout, error summary):
 * a title that counts or names the problem and one link per field. It takes focus when it first
 * renders, so it is read once, and has no `role="alert"` (D-2). A link moves focus to its field
 * instead of following the fragment. With no items the host is hidden.
 */
@Component({
  selector: 'zm-error-summary',
  host: {
    class: 'error-summary',
    role: 'group',
    tabindex: '-1',
    '[id]': 'summaryId()',
    '[attr.aria-labelledby]': 'titleId()',
    '[hidden]': '!items().length',
  },
  template: `@switch (headingLevel()) {
      @case (3) {
        <h3 class="error-summary__title" [id]="titleId()">{{ heading() }}</h3>
      }
      @default {
        <h2 class="error-summary__title" [id]="titleId()">{{ heading() }}</h2>
      }
    }
    <ul>
      @for (item of items(); track item.fieldId) {
        <li>
          <a [href]="'#' + item.fieldId" (click)="activate($event, item.fieldId)">{{
            item.message
          }}</a>
        </li>
      }
    </ul>`,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      padding: var(--space-5);
      border: var(--border-width-thick) solid var(--color-danger-border);
      background: var(--color-danger-bg);
      color: var(--color-fg-default);
    }

    :host([hidden]) {
      display: none;
    }

    .error-summary__title {
      font: var(--text-h4);
      text-transform: uppercase;
      color: var(--color-danger-fg);
    }

    ul {
      margin: 0;
      padding-left: var(--space-5);
    }

    a {
      color: var(--color-danger-fg);
      font-weight: var(--font-weight-bold);
      text-decoration: underline;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorSummary {
  /** "Couldn’t sign you in", "Fix 2 things before saving". */
  readonly heading = input.required<string>();
  /** The host's `id`; the title is `{summaryId}-title` and names the host. */
  readonly summaryId = input.required<string>();
  /** 2 on a page, 3 in a dialog or inside the booking bar. */
  readonly headingLevel = input<2 | 3>(2);
  readonly items = input.required<readonly ErrorSummaryItem[]>();
  /** Takes focus once when first rendered; off where the first invalid field takes it instead. */
  readonly autoFocus = input(true, { transform: booleanAttribute });
  /** A link was followed, after focus moved to its field. */
  readonly itemActivated = output<string>();

  protected readonly titleId = computed(() => `${this.summaryId()}-title`);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    afterNextRender(() => {
      if (this.autoFocus() && this.items().length) this.focus();
    });
  }

  /** Moves focus to the summary, for a second failed submit while it is already shown. */
  focus(): void {
    this.host.nativeElement.focus();
  }

  protected activate(event: Event, fieldId: string): void {
    event.preventDefault();
    this.host.nativeElement.ownerDocument.getElementById(fieldId)?.focus();
    this.itemActivated.emit(fieldId);
  }
}
