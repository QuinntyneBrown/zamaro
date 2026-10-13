import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  forwardRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { type ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CHECKBOX_GROUP } from './checkbox-group';

let nextId = 0;

/**
 * One native checkbox in its label (docs/specs/components/checkbox): a light choice row (`.choice`)
 * or a framed consent stub (`.choice--stub`), with its marker, description and own error. A boolean
 * control for reactive forms; consent is never pre-ticked, so the value starts `false`. Inside a
 * `zm-checkbox-group` with a `value`, its checked state is the group's and the group collects it.
 * The drawn `check` variant joins with its first screen.
 */
@Component({
  selector: 'zm-checkbox',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Checkbox), multi: true }],
  // The id belongs to the input; the host never repeats it, so the error summary's link finds the box.
  host: { '[class.full]': 'full()', '[attr.id]': 'null' },
  template: `<label class="choice" [class.choice--stub]="look() === 'stub'">
      <input
        #control
        type="checkbox"
        [id]="inputId()"
        [attr.name]="name() ?? group?.name()"
        [attr.value]="value() ?? null"
        [checked]="isChecked()"
        [disabled]="isDisabled()"
        [required]="!grouped() && (!!requiredMarker() || required())"
        [attr.aria-invalid]="isInvalid() ? 'true' : null"
        [attr.aria-describedby]="descriptions()"
        (change)="toggled($any($event.target).checked)"
        (blur)="blurred()"
      /><span class="choice__text"
        ><span
          ><ng-content />
          @if (requiredMarker()) {
            &ngsp;<span class="field__required">{{ requiredMarker() }}</span>
          }
        </span>
        @if (description()) {
          <small>{{ description() }}</small>
        }
      </span>
    </label>
    @if (error()) {
      <span class="field__error" [id]="errorId()">{{ error() }}</span>
    }`,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
      min-width: 0;
    }

    :host(.full) {
      grid-column: 1 / -1;
    }

    .choice {
      display: flex;
      gap: var(--space-3);
      align-items: flex-start;
      min-height: var(--target-comfortable);
      padding-block: var(--space-2);
      font: var(--text-body);
      cursor: pointer;
    }

    input {
      appearance: none;
      flex: none;
      display: grid;
      place-content: center;
      width: 1.25rem;
      height: 1.25rem;
      margin: 0.15rem 0 0;
      background: var(--color-bg-surface);
      border: var(--border-width-thick) solid var(--color-border-strong);
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition:
        background-color var(--duration-fast) var(--ease-standard),
        border-color var(--duration-fast) var(--ease-standard);
    }

    input:focus-visible {
      outline: var(--focus-ring-width) solid var(--color-focus-ring);
      outline-offset: var(--focus-ring-offset);
    }

    input:checked {
      background: var(--color-accent);
      border-color: var(--color-fg-on-accent);
    }

    input:checked::before {
      content: '';
      width: 0.75rem;
      height: 0.75rem;
      clip-path: polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%);
      background: var(--color-fg-on-accent);
    }

    input[aria-invalid='true'] {
      border-color: var(--color-danger-border);
    }

    input:disabled {
      background: var(--color-bg-subtle);
      border-color: var(--color-border-default);
      cursor: not-allowed;
    }

    /* A locked tick stays visible in both themes (D-12). */
    input:checked:disabled::before {
      background: var(--color-fg-muted);
    }

    input:disabled + .choice__text {
      color: var(--color-fg-disabled);
      cursor: not-allowed;
    }

    .choice__text {
      display: grid;
      gap: var(--space-0-5);
      min-width: 0;
    }

    small {
      font: var(--text-body-sm);
      color: var(--color-fg-muted);
    }

    .field__required {
      font: var(--text-caption);
      letter-spacing: var(--letter-spacing-normal);
      text-transform: none;
      color: var(--color-fg-muted);
    }

    .choice--stub {
      padding: var(--space-3) var(--space-4);
      background: var(--color-bg-surface);
      border: var(--border-width-thick) solid var(--color-border-strong);
    }

    .choice--stub:has(input:checked) {
      background: var(--color-accent-subtle);
    }

    .field__error {
      font: var(--text-caption);
      font-weight: var(--font-weight-bold);
      color: var(--color-danger-fg);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Checkbox implements ControlValueAccessor {
  readonly variant = input<'choice' | 'stub'>();
  /** The value the group collects; a child without one is standalone even inside a group. */
  readonly value = input<string>();
  /** Native `name`; the group's when inside one. */
  readonly name = input<string>();
  /** One sentence under the label, part of its name: "Optional. About once a month; unsubscribe any time." */
  readonly description = input<string>();
  /** "(required)" after the label; makes the box `required`. */
  readonly requiredMarker = input<string>();
  /** Native `required` without a visible marker. */
  readonly required = input(false, { transform: booleanAttribute });
  /** The input's `id`; the error is `{id}-error`. The error summary links to it. */
  readonly id = input<string>();
  /** Further IDs that describe the box, after its own error. */
  readonly describedBy = input<string>();
  /** The box's own error: "Accept the terms and privacy policy to create an account." */
  readonly error = input<string | null>(null);
  /** `aria-invalid` without a message of its own. */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Locks the box; ORed with the forms API's disabled state. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Spans every column of a form grid. */
  readonly full = input(false, { transform: booleanAttribute });

  protected readonly group = inject(CHECKBOX_GROUP, { optional: true });
  private readonly generatedId = `zm-checkbox-${nextId++}`;
  protected readonly inputId = computed(() => this.id() ?? this.generatedId);
  protected readonly errorId = computed(() => `${this.inputId()}-error`);
  /** In a group with a value: the group owns the checked state and the error. */
  protected readonly grouped = computed(() => this.group !== null && this.value() !== undefined);
  protected readonly look = computed(() => this.variant() ?? this.group?.variant() ?? 'choice');
  protected readonly isInvalid = computed(
    () => this.invalid() || !!this.error() || (this.grouped() && !!this.group?.invalid()),
  );
  protected readonly descriptions = computed(
    () =>
      [this.error() ? this.errorId() : null, this.describedBy()].filter(Boolean).join(' ') || null,
  );

  protected readonly checked = signal(false);
  private readonly formDisabled = signal(false);
  protected readonly isChecked = computed(() =>
    this.grouped() ? !!this.group?.has(this.value() ?? '') : this.checked(),
  );
  protected readonly isDisabled = computed(
    () => this.disabled() || this.formDisabled() || (this.grouped() && !!this.group?.disabled()),
  );

  private readonly control = viewChild.required<ElementRef<HTMLInputElement>>('control');
  private onChange: (value: boolean) => void = () => undefined;
  protected onTouched: () => void = () => undefined;

  /** Moves focus to the box, e.g. from the error summary. */
  focus(): void {
    this.control().nativeElement.focus();
  }

  protected toggled(checked: boolean): void {
    if (this.grouped()) {
      this.group?.toggle(this.value() ?? '', checked);
      return;
    }
    this.checked.set(checked);
    this.onChange(checked);
  }

  protected blurred(): void {
    if (this.grouped()) this.group?.touched();
    else this.onTouched();
  }

  writeValue(value: boolean | null): void {
    this.checked.set(!!value);
  }

  registerOnChange(onChange: (value: boolean) => void): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: () => void): void {
    this.onTouched = onTouched;
  }

  setDisabledState(disabled: boolean): void {
    this.formDisabled.set(disabled);
  }
}
