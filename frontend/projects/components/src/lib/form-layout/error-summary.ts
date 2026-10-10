import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export interface ErrorSummaryItem {
  /** The id of the field the link moves focus to. */
  readonly fieldId: string;
  readonly text: string;
}

/**
 * The form's error summary (docs/design-system/components/form-layout, `.error-summary`): a danger
 * panel announced as an alert, with the count as its heading and one link per invalid field. A link
 * emits `pick` with the field's id so the form can move focus to the control.
 */
@Component({
  selector: 'zm-error-summary',
  host: { class: 'error-summary', role: 'alert', '[attr.aria-labelledby]': 'titleId()' },
  template: `<h3 class="error-summary__title" [id]="titleId()">{{ heading() }}</h3>
    <ul>
      @for (item of items(); track item.fieldId) {
        <li>
          <a [href]="'#' + item.fieldId" (click)="follow($event, item.fieldId)">{{ item.text }}</a>
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
  readonly titleId = input('error-summary-title');
  readonly items = input.required<readonly ErrorSummaryItem[]>();
  /** Emits the field id of the link followed. */
  readonly pick = output<string>();

  protected follow(event: Event, fieldId: string): void {
    event.preventDefault();
    this.pick.emit(fieldId);
  }
}
