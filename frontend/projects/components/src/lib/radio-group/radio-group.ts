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

export type RadioVariant = 'choice' | 'radio' | 'stub' | 'card';

/** What a `zm-radio` reads from its group. */
export interface RadioGroupHost {
  readonly name: () => string;
  readonly variant: () => RadioVariant;
  readonly value: () => string | null;
  readonly invalid: () => boolean;
  readonly disabled: () => boolean;
  choose(value: string): void;
  touched(): void;
  /** True for the first radio registered, which carries the native `required`. */
  isFirst(radio: object): boolean;
  register(radio: object): void;
}

export const RADIO_GROUP = new InjectionToken<RadioGroupHost>('RadioGroup');

/**
 * Exactly one answer from every option at once (docs/specs/components/radio-group): the
 * `<fieldset>` with its legend, markers, help and error, the shared `name`, and the form control
 * whose value is the chosen radio's `value`. The options are `zm-radio` children.
 */
@Component({
  selector: 'zm-radio-group',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => RadioGroup), multi: true },
    { provide: RADIO_GROUP, useExisting: forwardRef(() => RadioGroup) },
  ],
  host: { '(focusout)': 'left($event)' },
  template: `<fieldset
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
      <span class="field__help" [id]="name() + '-help'">{{ help() }}</span>
    }
    <div
      class="choice-group__options"
      [class.choice-group__options--inline]="layout() === 'inline'"
      [class.choice-group__options--cards]="layout() === 'cards'"
    >
      <ng-content />
    </div>
    @if (error()) {
      <span class="field__error" [id]="name() + '-error'">{{ error() }}</span>
    }
  </fieldset>`,
  styles: `
    :host {
      display: block;
      min-width: 0;
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

    /* Stacked options take the fieldset's own gap (D-6). */
    .choice-group__options {
      display: contents;
    }

    .choice-group__options--inline {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-3) var(--space-6);
    }

    .choice-group__options--cards {
      display: grid;
      gap: var(--space-3);
      grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RadioGroup implements ControlValueAccessor, RadioGroupHost {
  /** The question, in the legend. */
  readonly legend = input.required<string>();
  /** The native `name` of every radio and the stem of the help, error and option IDs. */
  readonly name = input.required<string>();
  /** "(required)". */
  readonly requiredMarker = input<string>();
  /** "(optional)". */
  readonly optionalMarker = input<string>();
  readonly help = input<string>();
  /** The group's error, under the options; every radio turns invalid. */
  readonly error = input<string | null>(null);
  readonly variant = input<RadioVariant>('choice');
  readonly layout = input<'stack' | 'inline' | 'cards'>('stack');
  /** `heading` is the mocks' `fieldset.fieldset`; `label` the design system's `fieldset.choice-group`. */
  readonly legendStyle = input<'heading' | 'label'>('heading');

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly chosen = signal<string | null>(null);
  private readonly formDisabled = signal(false);
  private readonly registered: object[] = [];
  private onChange: (value: string | null) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  readonly value = computed(() => this.chosen());
  readonly invalid = computed(() => !!this.error());
  readonly disabled = computed(() => this.formDisabled());
  protected readonly isDisabled = computed(() => this.formDisabled());
  protected readonly describedBy = computed(
    () =>
      [this.error() ? `${this.name()}-error` : null, this.help() ? `${this.name()}-help` : null]
        .filter(Boolean)
        .join(' ') || null,
  );

  /** Focuses the checked radio, or the first enabled one: the error summary's link target. */
  focus(): void {
    const inputs = [
      ...this.host.nativeElement.querySelectorAll<HTMLInputElement>('input[type=radio]'),
    ];
    (
      inputs.find((radio) => radio.checked && !radio.disabled) ??
      inputs.find((radio) => !radio.disabled)
    )?.focus();
  }

  choose(value: string): void {
    this.chosen.set(value);
    this.onChange(value);
  }

  touched(): void {
    this.onTouched();
  }

  register(radio: object): void {
    if (!this.registered.includes(radio)) this.registered.push(radio);
  }

  isFirst(radio: object): boolean {
    return this.registered[0] === radio;
  }

  protected left(event: FocusEvent): void {
    const next = event.relatedTarget;
    if (!(next instanceof Node) || !this.host.nativeElement.contains(next)) this.onTouched();
  }

  writeValue(value: string | null): void {
    this.chosen.set(value ?? null);
  }

  registerOnChange(onChange: (value: string | null) => void): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: () => void): void {
    this.onTouched = onTouched;
  }

  setDisabledState(disabled: boolean): void {
    this.formDisabled.set(disabled);
  }
}

/** The token a `zm-radio` registers itself under, so the group can count its options. */
export const RADIO_CHILD = new InjectionToken<object>('Radio');
