import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { avatarInitials, type AvatarKind } from './avatar-initials';

/**
 * The round account button in the top bar (docs/specs/components/avatar.md): the person's initials
 * on the yellow disc, named for what it opens ("Account menu for Naomi Fraser"). It opens a dialog
 * holding a plain list, so it declares `aria-haspopup="dialog"` (avatar D-3). Built so far: the
 * initials; the photo and the loading skeleton come with their first callers.
 */
@Component({
  selector: 'zm-avatar-button',
  template: `<button
    class="avatar"
    [class.avatar--ink]="kind() === 'group'"
    type="button"
    aria-haspopup="dialog"
    [attr.aria-label]="label()"
    [attr.aria-expanded]="expanded()"
    [attr.aria-controls]="controls() ?? null"
  >
    {{ letters() }}
  </button>`,
  styles: `
    :host {
      display: inline-flex;
      flex: none;
    }

    .avatar {
      --avatar-size: 2.5rem;
      position: relative;
      display: inline-grid;
      place-items: center;
      width: var(--avatar-size);
      height: var(--avatar-size);
      flex: none;
      padding: 0;
      border-radius: var(--radius-full);
      background: var(--color-accent);
      color: var(--color-fg-on-accent);
      font: var(--text-stub);
      font-weight: var(--font-weight-bold);
      line-height: 1;
      text-transform: uppercase;
      border: var(--border-width-thick) solid var(--color-border-on-accent);
      cursor: pointer;
      transition: transform var(--duration-fast) var(--ease-spring);
    }

    .avatar:hover {
      transform: scale(1.06);
    }

    /* The disc stays 40 px; the target reaches 44 px around it (avatar D-4). */
    .avatar::before {
      content: '';
      position: absolute;
      inset: 50% auto auto 50%;
      width: var(--target-comfortable);
      height: var(--target-comfortable);
      translate: -50% -50%;
      border-radius: var(--radius-full);
    }

    .avatar--ink {
      background: var(--color-bg-inverse);
      color: var(--color-fg-inverse);
      border-color: var(--color-bg-inverse);
    }

    :host-context(.topbar) .avatar:focus-visible {
      outline-color: var(--color-accent-on-stage);
      box-shadow: 0 0 0 var(--focus-ring-offset) var(--color-bg-stage);
    }

    @media (forced-colors: active) {
      .avatar {
        border-color: CanvasText;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvatarButton {
  /** "Naomi Fraser": the source of the initials. */
  readonly name = input.required<string>();
  readonly kind = input<AvatarKind>('person');
  /** Overrides the initials worked out from `name`. */
  readonly initials = input<string>();
  /** The button's name, "Account menu for Naomi Fraser"; the initials never are. */
  readonly label = input.required<string>();
  readonly expanded = input(false);
  /** The id of the account menu it opens. */
  readonly controls = input<string>();

  protected readonly letters = computed(() =>
    (this.initials() ?? avatarInitials(this.name(), this.kind())).slice(0, 3),
  );
}
