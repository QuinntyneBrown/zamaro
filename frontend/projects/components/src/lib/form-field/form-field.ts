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
  readonly type = input<'text' | 'date' | 'select' | 'textarea'>('text');
  readonly options = input<readonly FieldOption[]>([]);
  readonly error = input<string | null>(null);
  readonly min = input<string>();
  readonly max = input<string>();
  readonly autocomplete = input<string>();
  readonly placeholder = input<string>();
  /** "(optional)", after the label. */
  readonly optionalMarker = input<string>();
  /** Announces each change of `error` politely, for a check that runs after the value changes. */
  readonly live = input(false, { transform: booleanAttribute });

  protected readonly value = signal('');
  protected readonly disabled = signal(false);
  protected readonly errorId = computed(() => `${this.fieldId()}-error`);

  /**
   * The `id` of the message in `[slot=message]` while it is shown. An input rather than a content
   * query, which cost every field about 8 % more to render (form-field CRD D-12).
   */
  readonly messageId = input<string | null>(null);

  /** The slotted message, then the error: only the parts that render. */
  protected readonly describedBy = computed(
    () =>
      [this.messageId(), this.error() ? this.errorId() : null].filter(Boolean).join(' ') || null,
  );

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
