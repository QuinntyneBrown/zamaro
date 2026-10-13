import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { type FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import { FormField } from 'components';

export interface ReferenceErrors {
  name?: string | null;
  church?: string | null;
  contact?: string | null;
}

/**
 * One church reference (apply-as-artist): a name, a church and a single "Phone or email" field;
 * the server stores the contact as an email when it parses as one and a phone number otherwise.
 */
@Component({
  selector: 'zm-reference-fieldset',
  imports: [FormField, ReactiveFormsModule, TranslocoPipe],
  template: `<fieldset class="fieldset" [formGroup]="group()" [disabled]="readonly()">
    <legend>{{ 'apply.references.legend' | transloco: { index: index() } }}</legend>
    <div class="form-grid">
      <zm-form-field
        [fieldId]="'ref' + index() + '-name'"
        formControlName="name"
        autocomplete="off"
        [label]="'apply.references.name' | transloco"
        [requiredMarker]="'apply.required' | transloco"
        [readonly]="readonly()"
        [error]="errors()?.name ?? null"
      />
      <zm-form-field
        [fieldId]="'ref' + index() + '-church'"
        formControlName="church"
        autocomplete="off"
        [label]="'apply.references.church' | transloco"
        [requiredMarker]="'apply.required' | transloco"
        [readonly]="readonly()"
        [error]="errors()?.church ?? null"
      />
      <zm-form-field
        class="field--full"
        [fieldId]="'ref' + index() + '-contact'"
        formControlName="contact"
        autocomplete="off"
        [label]="'apply.references.contact' | transloco"
        [requiredMarker]="'apply.required' | transloco"
        [readonly]="readonly()"
        [error]="errors()?.contact ?? null"
      />
    </div>
  </fieldset>`,
  styles: `
    :host {
      display: block;
      min-width: 0;
    }

    .fieldset {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
      border: 0;
      padding: 0;
      margin: 0;
      min-width: 0;
    }

    .fieldset > legend {
      font: var(--text-h4);
      text-transform: uppercase;
      padding: 0;
      margin-bottom: var(--space-4);
    }

    .form-grid {
      display: grid;
      gap: var(--space-4);
    }

    @media (min-width: 36rem) {
      .form-grid {
        grid-template-columns: 1fr 1fr;
      }

      .form-grid > .field--full {
        grid-column: 1 / -1;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReferenceFieldset {
  readonly index = input.required<1 | 2>();
  readonly group = input.required<FormGroup>();
  readonly errors = input<ReferenceErrors | null>(null);
  readonly readonly = input(false);
}
