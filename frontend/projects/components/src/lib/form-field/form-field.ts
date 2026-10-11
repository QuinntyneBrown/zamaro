import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  forwardRef,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { type ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface FieldOption {
  value: string;
  label: string;
}

/**
 * A labelled text, date, select or textarea control with its inline error (docs/design-system/
 * components/form-field, text-field, select, textarea). While `error` is set the control has
 * `aria-invalid="true"` and points to the message with `aria-describedby` (L2-102.3). A
 * `zm-inline-message` in `[slot=message]` describes the control too, listed first, when `messageId`
 * names it.
 * Works with reactive forms.
 */
@Component({
  selector: 'zm-form-field',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => FormField), multi: true },
  ],
  templateUrl: './form-field.html',
  styleUrl: './form-field.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormField implements ControlValueAccessor {
  readonly label = input.required<string>();
  readonly fieldId = input.required<string>();
  readonly type = input<
    'text' | 'email' | 'password' | 'tel' | 'number' | 'date' | 'select' | 'textarea'
  >('text');
  readonly options = input<readonly FieldOption[]>([]);
  readonly error = input<string | null>(null);
  readonly min = input<string>();
  readonly max = input<string>();
  readonly autocomplete = input<string>();
  readonly placeholder = input<string>();
  /** "(optional)", after the label. */
  readonly optionalMarker = input<string>();
  /** "(required)", after the label; makes the control `required`. Wins over `optionalMarker`. */
  readonly requiredMarker = input<string>();
  /** While a submit is pending: the value stays and cannot change (form-layout CRD D-11). */
  readonly readonly = input(false, { transform: booleanAttribute });
  /**
   * Marks the control invalid without a message of its own, for a form-level message such as
   * sign-in's "Email or password is incorrect." (text-field CRD D-6). ORed with `error`.
   */
  readonly invalid = input(false, { transform: booleanAttribute });
  /**
   * Muted lines after the error, one .field__help each, in order: "12 to 128 characters. Passwords
   * found in known data breaches are refused." IDs {fieldId}-help, -help-2, … (form-field CRD).
   */
  readonly help = input<string | readonly string[]>();
  /** Further IDs that describe the control, after its own ("credentials-error"). */
  readonly describedBy = input<string>();
  /** Announces each change of `error` politely, for a check that runs after the value changes. */
  readonly live = input(false, { transform: booleanAttribute });

  protected readonly value = signal('');
  protected readonly disabled = signal(false);
  protected readonly errorId = computed(() => `${this.fieldId()}-error`);

  /**
   * The `id` of the message in `[slot=message]` while it is shown. An input rather than a content
   * query, which cost every field about 8 % more to render (form-field CRD D-14).
   */
  readonly messageId = input<string | null>(null);

  /** Each help line with its ID. Help gives way to a slotted message, as the CRD says. */
  protected readonly helpLines = computed(() => {
    const help = this.help();
    if (!help || this.messageId()) return [];
    return (typeof help === 'string' ? [help] : help).filter(Boolean).map((text, index) => ({
      id: index ? `${this.fieldId()}-help-${index + 1}` : `${this.fieldId()}-help`,
      text,
    }));
  });

  /** The slotted message, the error, the help, then any form-level message: only the parts that render. */
  protected readonly descriptions = computed(
    () =>
      [
        this.messageId(),
        this.error() ? this.errorId() : null,
        ...this.helpLines().map((line) => line.id),
        this.describedBy(),
      ]
        .filter(Boolean)
        .join(' ') || null,
  );
  protected readonly isInvalid = computed(() => this.invalid() || !!this.error());

  private readonly control =
    viewChild<ElementRef<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>>('control');
  private onChange: (value: string) => void = () => undefined;
  protected onTouched: () => void = () => undefined;

  /** Moves focus to the control, e.g. the first invalid field after a submit. */
  focus(): void {
    this.control()?.nativeElement.focus();
  }

  protected changed(value: string): void {
    this.value.set(value);
    this.onChange(value);
  }

  writeValue(value: string | null): void {
    this.value.set(value ?? '');
  }

  registerOnChange(onChange: (value: string) => void): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: () => void): void {
    this.onTouched = onTouched;
  }

  setDisabledState(disabled: boolean): void {
    this.disabled.set(disabled);
  }
}
