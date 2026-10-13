import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  forwardRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { type ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Icon } from '../icon/icon';
import { CHECKBOX_GROUP } from './checkbox-group';

let nextId = 0;

/**
 * One native checkbox in its label (docs/specs/components/checkbox): a light choice row (`.choice`)
 * or a framed consent stub (`.choice--stub`), with its marker, description and own error. A boolean
 * control for reactive forms; consent is never pre-ticked, so the value starts `false`. Inside a
 * `zm-checkbox-group` with a `value`, its checked state is the group's and the group collects it.
 * The drawn `check` variant (`.check`) is the admin tools' box ("Reference verified") and the
 * select-all parent's, with the indeterminate state.
 */
@Component({
  selector: 'zm-checkbox',
  imports: [Icon],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Checkbox), multi: true }],
  // The id belongs to the input; the host never repeats it, so the error summary's link finds the box.
  host: { '[class.full]': 'full()', '[attr.id]': 'null' },
  template: `<label
      [class.choice]="look() !== 'check'"
      [class.choice--stub]="look() === 'stub'"
      [class.check]="look() === 'check'"
      [class.check--indent]="indent()"
    >
      <input
        #control
        type="checkbox"
        [class.check__input]="look() === 'check'"
        [id]="inputId()"
        [attr.name]="name() ?? group?.name()"
        [attr.value]="value() ?? null"
        [checked]="isChecked()"
        [disabled]="isDisabled()"
        [required]="!grouped() && (!!requiredMarker() || required())"
        [attr.aria-label]="label() || null"
        [attr.aria-controls]="controls() || null"
        [attr.aria-invalid]="isInvalid() ? 'true' : null"
        [attr.aria-describedby]="descriptions()"
        (change)="toggled($any($event.target).checked)"
        (blur)="blurred()"
      />
      @if (look() === 'check') {
        <span class="check__box" aria-hidden="true"
          ><zm-icon class="check__tick" name="check" /><zm-icon class="check__dash" name="dash"
        /></span>
      }
      @if (!label()) {
        <span [class.choice__text]="look() !== 'check'" [class.check__text]="look() === 'check'"
          ><span
            ><ng-content />
            @if (requiredMarker()) {
              &ngsp;<span class="field__required">{{ requiredMarker() }}</span>
            } @else if (optionalMarker()) {
              &ngsp;<span class="field__optional">{{ optionalMarker() }}</span>
            }
          </span>
          @if (description()) {
            <small [class.check__desc]="look() === 'check'">{{ description() }}</small>
          }
        </span>
      }
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

    .choice input {
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

    .choice input:focus-visible {
      outline: var(--focus-ring-width) solid var(--color-focus-ring);
      outline-offset: var(--focus-ring-offset);
    }

    .choice input:checked {
      background: var(--color-accent);
      border-color: var(--color-fg-on-accent);
    }

    .choice input:checked::before {
      content: '';
      width: 0.75rem;
      height: 0.75rem;
      clip-path: polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%);
      background: var(--color-fg-on-accent);
    }

    .choice input[aria-invalid='true'] {
      border-color: var(--color-danger-border);
    }

    .choice input:disabled {
      background: var(--color-bg-subtle);
      border-color: var(--color-border-default);
      cursor: not-allowed;
    }

    /* A locked tick stays visible in both themes (D-12). */
    .choice input:checked:disabled::before {
      background: var(--color-fg-muted);
    }

    .choice input:disabled + .choice__text {
      color: var(--color-fg-disabled);
      cursor: not-allowed;
    }

    .choice__text {
      display: grid;
      gap: var(--space-0-5);
      min-width: 0;
    }

    small {
      display: block;
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

    .field__optional {
      font: var(--text-caption);
      letter-spacing: var(--letter-spacing-normal);
      text-transform: none;
      color: var(--color-fg-muted);
    }

    .field__error {
      font: var(--text-caption);
      font-weight: var(--font-weight-bold);
      color: var(--color-danger-fg);
    }

    /* The drawn box (CRD: anatomy "Drawn box"): the input is hidden but focusable, the box draws the state. */
    .check {
      position: relative;
      display: inline-flex;
      gap: var(--space-3);
      align-items: flex-start;
      min-height: var(--target-min);
      font: var(--text-body);
      cursor: pointer;
    }

    .check--indent {
      padding-inline-start: var(--space-8);
    }

    .check__input {
      position: absolute;
      width: 1px;
      height: 1px;
      margin: 0;
      opacity: 0;
    }

    .check__box {
      --control-bg: var(--color-bg-surface);
      --control-border: var(--color-border-strong);
      --control-fg: var(--color-fg-on-accent);
      flex: none;
      display: grid;
      place-items: center;
      width: var(--target-min);
      height: var(--target-min);
      background: var(--control-bg);
      border: var(--border-width-thick) solid var(--control-border);
      border-radius: var(--radius-xs);
      color: var(--control-fg);
      transition:
        background-color var(--duration-fast) var(--ease-standard),
        border-color var(--duration-fast) var(--ease-standard);
    }

    .check__box zm-icon {
      grid-area: 1 / 1;
      opacity: 0;
    }

    .check:hover .check__box {
      --control-bg: var(--color-accent-subtle);
    }

    .check__input:checked + .check__box,
    .check__input:indeterminate + .check__box {
      --control-bg: var(--color-accent);
      --control-border: var(--color-border-on-accent);
    }

    .check__input:checked + .check__box .check__tick {
      opacity: 1;
    }

    .check__input:indeterminate + .check__box .check__tick {
      opacity: 0;
    }

    .check__input:indeterminate + .check__box .check__dash {
      opacity: 1;
    }

    .check__input:focus-visible + .check__box {
      outline: var(--focus-ring-width) solid var(--color-focus-ring);
      outline-offset: var(--focus-ring-offset);
      box-shadow: 0 0 0 var(--focus-ring-offset) var(--color-focus-ring-offset);
    }

    .check__input[aria-invalid='true'] + .check__box {
      --control-border: var(--color-danger-border);
    }

    .check__input:disabled + .check__box {
      --control-bg: var(--color-bg-subtle);
      --control-border: var(--color-fg-disabled);
      --control-fg: var(--color-fg-disabled);
    }

    .check:has(.check__input:disabled) {
      cursor: not-allowed;
    }

    .check__input:disabled ~ .check__text {
      color: var(--color-fg-disabled);
    }

    .check__text {
      display: grid;
      gap: var(--space-0-5);
      min-width: 0;
      padding-top: var(--space-0-5);
    }

    .check__desc {
      font: var(--text-body-sm);
      color: var(--color-fg-muted);
    }

    @media (pointer: coarse) {
      .check {
        min-height: var(--target-comfortable);
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Checkbox implements ControlValueAccessor {
  readonly variant = input<'choice' | 'stub' | 'check'>();
  /** The value the group collects; a child without one is standalone even inside a group. */
  readonly value = input<string>();
  /** Native `name`; the group's when inside one. */
  readonly name = input<string>();
  /** One sentence under the label, part of its name: "Optional. About once a month; unsubscribe any time." */
  readonly description = input<string>();
  /** "(required)" after the label; makes the box `required`. */
  readonly requiredMarker = input<string>();
  /** "(optional)" after the label; `requiredMarker` wins when both are set. */
  readonly optionalMarker = input<string>();
  /** The mixed state of a select-all parent (`check` only): the native property, set again by the page after a toggle. */
  readonly indeterminate = input(false, { transform: booleanAttribute });
  /** `aria-controls`: the boxes a select-all parent controls. */
  readonly controls = input<string>();
  /** `aria-label` for a box with no visible text ("Select Abigail Mensah, Sat 14 Nov"); the text element is then not rendered. */
  readonly label = input<string>();
  /** Indents a child under a select-all parent (`check` only). */
  readonly indent = input(false, { transform: booleanAttribute });
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

  /** The input of whichever branch renders; absent until the first render. */
  private readonly control = viewChild<ElementRef<HTMLInputElement>>('control');
  private onChange: (value: boolean) => void = () => undefined;
  protected onTouched: () => void = () => undefined;

  constructor() {
    // `indeterminate` has no attribute: it is a property, set whenever the input or the box changes.
    effect(() => {
      const control = this.control();
      if (control)
        control.nativeElement.indeterminate = this.look() === 'check' && this.indeterminate();
    });
  }

  /** Moves focus to the box, e.g. from the error summary. */
  focus(): void {
    this.control()?.nativeElement.focus();
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
