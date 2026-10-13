import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  forwardRef,
  inject,
  InjectionToken,
  input,
  signal,
} from '@angular/core';
import { type ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/** What a `zm-checkbox` with a `value` reads from its group. */
export interface CheckboxGroupHost {
  readonly name: () => string | undefined;
  readonly variant: () => 'choice' | 'stub' | 'check';
  readonly invalid: () => boolean;
  readonly disabled: () => boolean;
  has(value: string): boolean;
  toggle(value: string, checked: boolean): void;
  touched(): void;
}

export const CHECKBOX_GROUP = new InjectionToken<CheckboxGroupHost>('CheckboxGroup');

let nextId = 0;

/**
 * Several boxes that answer one question (docs/specs/components/checkbox): the `<fieldset>` with
 * its legend, markers, help and one error for the lot, and the form control whose value is the
 * ticked children's values in DOM order. The options are `zm-checkbox` children with a `value`.
 */
@Component({
  selector: 'zm-checkbox-group',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => CheckboxGroup), multi: true },
    { provide: CHECKBOX_GROUP, useExisting: forwardRef(() => CheckboxGroup) },
  ],
  host: { '(focusout)': 'left($event)' },
  template: `<fieldset
    [id]="groupId()"
    [class.fieldset]="legendStyle() === 'heading'"
    [class.choice-group]="legendStyle() === 'label'"
    [disabled]="isDisabled()"
    [attr.aria-describedby]="describedBy()"
  >
    <legend>
      {{ legend() }}
      @if (requiredMarker()) {
        &ngsp;<span class="field__required">{{ requiredMarker() }}</span>
      } @else if (optionalMarker()) {
        &ngsp;<span class="field__optional">{{ optionalMarker() }}</span>
      }
    </legend>
    @if (help()) {
      <span class="field__help" [id]="groupId() + '-help'">{{ help() }}</span>
    }
    <div
      class="choice-group__options"
      [class.choice-group__options--inline]="layout() === 'inline'"
    >
      <ng-content />
    </div>
    @if (error()) {
      <span class="field__error" [id]="groupId() + '-error'">{{ error() }}</span>
    }
  </fieldset>`,
  styles: `
    :host {
      display: block;
      min-width: 0;
      grid-column: 1 / -1;
    }

    .fieldset,
    .choice-group {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
      border: 0;
      padding: 0;
      margin: 0;
      min-width: 0;
    }

    .choice-group {
      gap: var(--space-3);
    }

    .fieldset > legend {
      font: var(--text-h4);
      text-transform: uppercase;
      padding: 0;
      margin-bottom: var(--space-4);
    }

    .choice-group > legend {
      font: var(--text-overline);
      letter-spacing: var(--letter-spacing-stamp);
      text-transform: uppercase;
      margin-bottom: var(--space-3);
      padding: 0;
    }

    .field__required {
      font: var(--text-caption);
      letter-spacing: var(--letter-spacing-normal);
      text-transform: none;
      color: var(--color-fg-muted);
    }

    .field__optional {
      color: var(--color-fg-muted);
    }

    .field__help {
      font: var(--text-caption);
      color: var(--color-fg-muted);
    }

    .field__error {
      display: block;
      font: var(--text-caption);
      font-weight: var(--font-weight-bold);
      color: var(--color-danger-fg);
    }

    .choice-group__options {
      display: contents;
    }

    .choice-group__options--inline {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-3) var(--space-6);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckboxGroup implements ControlValueAccessor, CheckboxGroupHost {
  readonly legend = input.required<string>();
  /** "(required, pick 1 to 4)". */
  readonly requiredMarker = input<string>();
  readonly optionalMarker = input<string>();
  readonly help = input<string>();
  /** One error for the group, after the options; every child turns invalid. */
  readonly error = input<string | null>(null);
  /** The children's default look. */
  readonly variant = input<'choice' | 'stub' | 'check'>('choice');
  readonly layout = input<'stack' | 'inline'>('stack');
  readonly legendStyle = input<'heading' | 'label'>('heading');
  /** Native `name` for every child without its own. */
  readonly name = input<string>();
  /** The fieldset's `id`, stem of the help and error IDs. */
  readonly id = input<string>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly generatedId = `zm-checkbox-group-${nextId++}`;
  protected readonly groupId = computed(() => this.id() ?? this.generatedId);
  private readonly ticked = signal<readonly string[]>([]);
  private readonly formDisabled = signal(false);
  private onChange: (value: readonly string[]) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  readonly invalid = computed(() => !!this.error());
  readonly disabled = computed(() => this.formDisabled());
  protected readonly isDisabled = computed(() => this.formDisabled());
  protected readonly describedBy = computed(
    () =>
      [
        this.error() ? `${this.groupId()}-error` : null,
        this.help() ? `${this.groupId()}-help` : null,
      ]
        .filter(Boolean)
        .join(' ') || null,
  );

  /** Focuses the first enabled child's box: the error summary's link target. */
  focus(): void {
    [...this.host.nativeElement.querySelectorAll<HTMLInputElement>('input[type=checkbox]')]
      .find((box) => !box.disabled)
      ?.focus();
  }

  has(value: string): boolean {
    return this.ticked().includes(value);
  }

  /** Ticks or unticks a value; the model keeps the children's DOM order. */
  toggle(value: string, checked: boolean): void {
    const order = [
      ...this.host.nativeElement.querySelectorAll<HTMLInputElement>('input[type=checkbox]'),
    ].map((box) => box.value);
    const next = new Set(this.ticked());
    if (checked) next.add(value);
    else next.delete(value);
    const value$ = [...next].sort((a, b) => order.indexOf(a) - order.indexOf(b));
    this.ticked.set(value$);
    this.onChange(value$);
  }

  touched(): void {
    this.onTouched();
  }

  protected left(event: FocusEvent): void {
    const next = event.relatedTarget;
    if (!(next instanceof Node) || !this.host.nativeElement.contains(next)) this.onTouched();
  }

  writeValue(value: readonly string[] | null): void {
    this.ticked.set(value ? [...value] : []);
  }

  registerOnChange(onChange: (value: readonly string[]) => void): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: () => void): void {
    this.onTouched = onTouched;
  }

  setDisabledState(disabled: boolean): void {
    this.formDisabled.set(disabled);
  }
}
