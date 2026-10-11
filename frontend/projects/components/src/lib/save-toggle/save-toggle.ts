import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  isDevMode,
  output,
} from '@angular/core';
import { Icon } from '../icon/icon';
import { SAVE_TOGGLE_TEXT } from './save-toggle-text';

/**
 * The round heart on a ticket and on the headliner (docs/specs/components/save-toggle): it shows the
 * value it is given and reports a press; the app's store saves (D-1). The name always names the
 * artist and says what pressing will do.
 */
@Component({
  selector: 'zm-save-toggle',
  imports: [Icon],
  template: `<button
    class="save"
    type="button"
    [attr.aria-pressed]="saved() ? 'true' : 'false'"
    [attr.aria-label]="label()"
    [attr.aria-busy]="busy() ? 'true' : null"
    [attr.aria-disabled]="busy() ? 'true' : null"
    [disabled]="disabled() && !busy()"
    (click)="press($event)"
  >
    <zm-icon name="heart" />
  </button>`,
  styles: `
    :host {
      display: inline-flex;
      flex: none;
    }

    .save {
      --save-bg: var(--color-bg-surface);
      --save-fg: var(--color-fg-default);
      --save-border: var(--color-border-strong);
      display: inline-grid;
      place-items: center;
      width: var(--target-comfortable);
      height: var(--target-comfortable);
      padding: 0;
      border: var(--border-width-thick) solid var(--save-border);
      border-radius: var(--radius-full);
      background: var(--save-bg);
      color: var(--save-fg);
      cursor: pointer;
      transition:
        transform var(--duration-fast) var(--ease-spring),
        background var(--duration-fast) var(--ease-standard);
    }

    .save[aria-pressed='true'] {
      --save-bg: var(--color-accent);
      --save-fg: var(--color-fg-on-accent);
      --save-border: var(--color-border-on-accent);
      --zm-icon-fill: currentColor;
    }

    @media (hover: hover) {
      .save:hover:not(:disabled):not([aria-busy='true']) {
        transform: scale(1.08);
      }
    }

    .save:active:not(:disabled) {
      transform: scale(0.94);
    }

    .save:disabled {
      --save-bg: var(--color-bg-subtle);
      --save-fg: var(--color-fg-disabled);
      --save-border: var(--color-fg-disabled);
      cursor: not-allowed;
      transform: none;
    }

    .save[aria-busy='true'] {
      cursor: progress;
    }

    .save[aria-busy='true'] zm-icon {
      animation: save-pulse var(--duration-loop) var(--ease-standard) infinite alternate;
    }

    @keyframes save-pulse {
      to {
        opacity: 0.35;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .save[aria-busy='true'] zm-icon {
        animation: none;
      }
    }

    @media (forced-colors: active) {
      .save {
        border-color: CanvasText;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SaveToggle {
  /** "Daniel & Ruth Okonkwo". */
  readonly artistName = input.required<string>();
  readonly saved = input(false);
  /** A save is in flight: the value has already flipped; presses are ignored. */
  readonly busy = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  /** The requested value, once per press. */
  readonly savedChange = output<boolean>();

  private readonly text = inject(SAVE_TOGGLE_TEXT, { optional: true });

  protected readonly label = computed(() => {
    if (!this.text) {
      if (isDevMode())
        console.error('zm-save-toggle needs SAVE_TOGGLE_TEXT bound in app.config.ts.');
      return '';
    }
    const name = this.artistName().replace(/ & /g, ` ${this.text.and} `);
    return this.saved() ? this.text.remove(name) : this.text.save(name);
  });

  protected press(event: Event): void {
    if (this.busy() || this.disabled()) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    this.savedChange.emit(!this.saved());
  }
}
