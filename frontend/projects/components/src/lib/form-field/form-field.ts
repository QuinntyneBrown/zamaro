import {
  ChangeDetectionStrategy,
  Component,
  computed,
  type ElementRef,
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
 * A labelled text, date or select control with its inline error (docs/design-system/components/
 * form-field, text-field, select). While `error` is set the control has `aria-invalid="true"` and
 * points to the message with `aria-describedby` (L2-102.3). Works with reactive forms.
 */
@Component({
  selector: 'zm-form-field',
  host: { '[class.field--inline]': 'inline()' },
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
  readonly type = input<'text' | 'date' | 'select'>('text');
  readonly options = input<readonly FieldOption[]>([]);
  readonly error = input<string | null>(null);
  readonly min = input<string>();
  readonly max = input<string>();
  readonly autocomplete = input<string>();
  /** Sits in a row beside other content, such as the lineup's sort, at a usable minimum width. */
  readonly inline = input(false);

  protected readonly value = signal('');
  protected readonly disabled = signal(false);
  protected readonly errorId = computed(() => `${this.fieldId()}-error`);

  private readonly control = viewChild<ElementRef<HTMLInputElement | HTMLSelectElement>>('control');
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
