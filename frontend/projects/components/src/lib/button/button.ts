import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

export type ButtonVariant = 'secondary' | 'primary' | 'ghost';

/**
 * The design-system button (docs/design-system/components/button). An icon-only button needs
 * `label`, its accessible name. Link buttons (an `<a>` sharing the same slot) arrive with the first
 * screen that needs one.
 */
@Component({
  selector: 'zm-button',
  template: `<button
    [class]="classes()"
    [type]="type()"
    [attr.aria-label]="label()"
    [attr.aria-pressed]="pressed()"
    [attr.aria-expanded]="expanded()"
    [attr.aria-controls]="controls()"
  >
    <ng-content />
  </button>`,
  styles: `
    :host {
      display: inline-flex;
    }

    .btn {
      --btn-bg: var(--color-bg-surface);
      --btn-fg: var(--color-fg-default);
      --btn-border: var(--color-border-strong);
      --btn-bg-hover: var(--btn-bg);
      --btn-fg-hover: var(--btn-fg);
      --btn-bg-active: var(--btn-bg-hover);
      --btn-shadow-hover: var(--shadow-1);
      --btn-transform-hover: var(--transform-lift);
      --btn-height: var(--control-height-md);
      --btn-padding: var(--space-5);
      --btn-font-size: var(--font-size-sm);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-2);
      min-height: var(--btn-height);
      padding-inline: var(--btn-padding);
      padding-block: var(--space-1);
      font: var(--text-label);
      font-size: var(--btn-font-size);
      text-transform: uppercase;
      letter-spacing: var(--letter-spacing-wide);
      text-decoration: none;
      text-align: center;
      text-wrap: balance;
      color: var(--btn-fg);
      background: var(--btn-bg);
      border: var(--border-width-thick) solid var(--btn-border);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition:
        transform var(--duration-fast) var(--ease-standard),
        box-shadow var(--duration-fast) var(--ease-standard),
        background var(--duration-fast) var(--ease-standard);
    }

    .btn:hover {
      background: var(--btn-bg-hover);
      color: var(--btn-fg-hover);
      box-shadow: var(--btn-shadow-hover);
      transform: var(--btn-transform-hover);
    }

    .btn:active {
      background: var(--btn-bg-active);
      box-shadow: none;
      transform: none;
    }

    .btn--primary {
      --btn-bg: var(--color-accent);
      --btn-fg: var(--color-fg-on-accent);
      --btn-border: var(--color-border-on-accent);
      --btn-bg-hover: var(--color-accent-hover);
      --btn-bg-active: var(--color-accent-active);
    }

    .btn--ghost {
      --btn-bg: transparent;
      --btn-border: transparent;
      --btn-bg-hover: var(--color-bg-subtle);
      --btn-bg-active: var(--color-bg-subtle-hover);
      --btn-shadow-hover: none;
      --btn-transform-hover: none;
    }

    .btn--icon {
      --btn-padding: 0;
      width: var(--btn-height);
    }

    .btn[aria-pressed='true'] {
      --btn-bg: var(--color-accent);
      --btn-fg: var(--color-fg-on-accent);
      --btn-border: var(--color-border-on-accent);
      --btn-bg-hover: var(--color-accent-hover);
      --zm-icon-fill: currentColor;
    }

    .btn[aria-expanded='true'] {
      --btn-bg: var(--color-bg-subtle);
      box-shadow: none;
      transform: none;
    }

    /* Ghost buttons in the top bar and on the stage take the surrounding colour. */
    :host-context(.topbar) .btn--ghost,
    :host-context(.on-stage) .btn--ghost {
      --btn-fg: currentColor;
      --btn-border: transparent;
      --btn-bg: transparent;
      --btn-bg-hover: transparent;
      --btn-fg-hover: var(--color-accent-on-stage);
    }

    :host-context(.topbar) .btn--ghost[aria-pressed='true'] {
      --btn-fg: var(--color-accent-on-stage);
      --btn-fg-hover: var(--color-accent-on-stage);
    }

    :host-context(.topbar) .btn:focus-visible,
    :host-context(.on-stage) .btn:focus-visible {
      outline-color: var(--color-accent-on-stage);
      box-shadow: 0 0 0 var(--focus-ring-offset) var(--color-bg-stage);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Button {
  readonly variant = input<ButtonVariant>('secondary');
  readonly iconOnly = input(false, { transform: booleanAttribute });
  readonly type = input<'button' | 'submit'>('button');
  /** Accessible name when the visible content is only an icon. */
  readonly label = input<string>();
  /** Toggle state; leave unset for an ordinary button. */
  readonly pressed = input<boolean>();
  readonly expanded = input<boolean>();
  readonly controls = input<string>();

  protected readonly classes = computed(
    () => `btn btn--${this.variant()}${this.iconOnly() ? ' btn--icon' : ''}`,
  );
}
