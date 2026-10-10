import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DOCUMENT,
  ElementRef,
  inject,
  input,
  output,
} from '@angular/core';

export interface ErrorSummaryItem {
  /** The id of the invalid field the link moves focus to. */
  readonly fieldId: string;
  readonly message: string;
}

/**
 * A form's error summary (docs/specs/components/form-layout.md, `.error-summary`): a danger panel
 * announced as an alert, its heading the count, one link per invalid field in field order. A link
 * focuses its field, then emits `itemActivated`. Hidden while there are no items.
 */
@Component({
  selector: 'zm-error-summary',
  host: {
    class: 'error-summary',
    role: 'alert',
    tabindex: '-1',
    '[attr.id]': 'summaryId()',
    '[attr.aria-labelledby]': 'titleId()',
    '[hidden]': '!items().length',
  },
  template: `@if (headingLevel() === 3) {
      <h3 class="error-summary__title" [id]="titleId()">{{ heading() }}</h3>
    } @else {
      <h2 class="error-summary__title" [id]="titleId()">{{ heading() }}</h2>
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
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorSummary {
  /** "Two things before we can search". */
  readonly heading = input.required<string>();
  /** The host's id; the title is `{summaryId}-title` and labels the host. */
  readonly summaryId = input.required<string>();
  /** 2 on a page, 3 in a dialog or inside the booking bar. */
  readonly headingLevel = input<2 | 3>(2);
  readonly items = input.required<readonly ErrorSummaryItem[]>();
  /** Focuses the summary once when it first renders; Discover focuses the first field instead. */
  readonly autoFocus = input(true, { transform: booleanAttribute });
  /** Emits the field id after a link has moved focus to that field. */
  readonly itemActivated = output<string>();

  protected readonly titleId = computed(() => `${this.summaryId()}-title`);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly document = inject(DOCUMENT);

  constructor() {
    afterNextRender(() => {
      if (this.autoFocus() && this.items().length) this.focus();
    });
  }

  /** Focuses the summary, e.g. after a second failed submit while it is already shown. */
  focus(): void {
    this.host.nativeElement.focus();
  }

  protected activate(event: Event, fieldId: string): void {
    event.preventDefault();
    this.document.getElementById(fieldId)?.focus();
    this.itemActivated.emit(fieldId);
  }
}
