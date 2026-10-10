import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

export type ButtonVariant = 'secondary' | 'primary' | 'ghost' | 'ink';
export type ButtonSize = 'md' | 'lg';

/** The `btn` classes both button components render. */
export function buttonClasses(variant: ButtonVariant, size: ButtonSize, iconOnly = false): string {
  return `btn btn--${variant}${size === 'lg' ? ' btn--lg' : ''}${iconOnly ? ' btn--icon' : ''}`;
}

/**
 * The design-system button (docs/design-system/components/button). An icon-only button needs
 * `label`, its accessible name. A link that looks like a button is `zm-button-link`; keeping the two
 * apart keeps this, the most rendered control, free of a conditional slot.
 */
@Component({
  selector: 'zm-button',
  template: `<button
    [class]="classes()"
    [type]="type()"
    [disabled]="disabled()"
    [attr.aria-busy]="busy() ? 'true' : null"
    [attr.aria-disabled]="busy() ? 'true' : null"
    [attr.aria-label]="label()"
    [attr.aria-pressed]="pressed()"
    [attr.aria-expanded]="expanded()"
    [attr.aria-controls]="controls()"
  >
    <ng-content />
  </button>`,
  styleUrl: './button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Button {
  readonly variant = input<ButtonVariant>('secondary');
  readonly size = input<ButtonSize>('md');
  readonly iconOnly = input(false, { transform: booleanAttribute });
  readonly type = input<'button' | 'submit'>('button');
  /** Accessible name when the visible content is only an icon. */
  readonly label = input<string>();
  /** Toggle state; leave unset for an ordinary button. */
  readonly pressed = input<boolean>();
  readonly expanded = input<boolean>();
  readonly controls = input<string>();
  /** Waiting on the action it started: a spinner, and a second press is ignored by the owner. */
  readonly busy = input(false);
  readonly disabled = input(false);

  protected readonly classes = computed(() =>
    buttonClasses(this.variant(), this.size(), this.iconOnly()),
  );
}
