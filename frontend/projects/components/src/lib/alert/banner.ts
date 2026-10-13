import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon, type IconName } from '../icon/icon';

const ICONS: Record<'info' | 'success' | 'warning' | 'danger', IconName> = {
  info: 'info',
  success: 'check',
  warning: 'warning',
  danger: 'warning',
};

/**
 * A full-width banner under the top bar (docs/specs/components/alert.md): a short label, one sentence
 * (the projected content) and at most one inline action, a router link, an external link or a button
 * that emits `actionPressed`. `persistent` banners stay until their cause is fixed; `dismissible` ones
 * have a close button and the shell removes them on `dismissed`.
 */
@Component({
  selector: 'zm-banner',
  imports: [Icon, RouterLink],
  template: `<div
    class="banner"
    [class]="'banner--' + variant()"
    [class.banner--persistent]="persistent()"
    [attr.role]="live() === 'off' ? null : live()"
  >
    <zm-icon [name]="iconName()" />
    <p class="banner__text banner__text--fill">
      <strong>{{ label() }}</strong
      ><ng-content />
      @if (actionLabel(); as action) {
        @if (actionLink(); as link) {
          <a class="banner__action" [routerLink]="link">{{ action }}</a>
        } @else if (actionHref(); as href) {
          <a class="banner__action" [href]="href">{{ action }}</a>
        } @else {
          <button
            class="banner__action"
            type="button"
            [disabled]="actionDisabled()"
            (click)="actionPressed.emit()"
          >
            {{ action }}
          </button>
        }
      }
    </p>
    @if (dismissible() && !persistent()) {
      <button
        class="close"
        type="button"
        [attr.aria-label]="dismissLabel()"
        (click)="dismissed.emit()"
      >
        <zm-icon name="close" size="sm" />
      </button>
    }
  </div>`,
  styles: `
    :host {
      display: block;
    }

    .banner {
      --alert-bg: var(--color-warning-bg);
      --alert-border: var(--color-warning-icon);
      --alert-icon: var(--color-warning-icon);
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-3) var(--layout-margin);
      background: var(--alert-bg);
      color: var(--color-fg-default);
      border-bottom: var(--border-width-thick) solid var(--alert-border);
      font: var(--text-body-sm);
    }

    .banner--info {
      --alert-bg: var(--color-info-bg);
      --alert-border: var(--color-info-border);
      --alert-icon: var(--color-info-icon);
    }

    .banner--success {
      --alert-bg: var(--color-success-bg);
      --alert-border: var(--color-success-border);
      --alert-icon: var(--color-success-icon);
    }

    .banner--danger {
      --alert-bg: var(--color-danger-bg);
      --alert-border: var(--color-danger-border);
      --alert-icon: var(--color-danger-icon);
    }

    .banner > zm-icon {
      color: var(--alert-icon);
    }

    .banner__text--fill {
      flex: 1 1 0;
      min-width: 0;
      overflow-wrap: anywhere;
    }

    .banner__text strong {
      margin-right: var(--space-2);
      font: var(--text-label);
      text-transform: uppercase;
      letter-spacing: var(--letter-spacing-wide);
    }

    .banner__action {
      margin-left: var(--space-2);
      font: var(--text-label);
      text-transform: uppercase;
      letter-spacing: var(--letter-spacing-wide);
      color: inherit;
      text-decoration: underline;
      text-underline-offset: 0.22em;
    }

    button.banner__action {
      min-height: var(--target-min);
      padding: 0;
      border: 0;
      background: none;
      cursor: pointer;
    }

    button.banner__action:disabled {
      color: var(--color-fg-muted);
      cursor: default;
    }

    .close {
      display: grid;
      place-items: center;
      width: var(--control-height-sm);
      height: var(--control-height-sm);
      flex: none;
      border: 0;
      background: none;
      color: inherit;
      cursor: pointer;
    }

    .close:hover {
      background: color-mix(in srgb, currentColor 12%, transparent);
    }

    @media (pointer: coarse) {
      button.banner__action {
        min-height: var(--target-comfortable);
      }

      .close {
        width: var(--target-comfortable);
        height: var(--target-comfortable);
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Banner {
  readonly variant = input<'info' | 'success' | 'warning' | 'danger'>('warning');
  /** "Verify your email", "Email verified", "Maintenance". */
  readonly label = input.required<string>();
  readonly icon = input<IconName>();
  readonly live = input<'alert' | 'status' | 'off'>('status');
  readonly actionLabel = input<string>();
  readonly actionLink = input<string | unknown[]>();
  readonly actionHref = input<string>();
  /** A button action that cannot be pressed now ("Sent"). */
  readonly actionDisabled = input(false, { transform: booleanAttribute });
  /** No close button: the banner stays until its cause is fixed. */
  readonly persistent = input(false, { transform: booleanAttribute });
  readonly dismissible = input(false, { transform: booleanAttribute });
  /** The close button's name: "Dismiss verified notice". */
  readonly dismissLabel = input<string>();

  readonly actionPressed = output<void>();
  readonly dismissed = output<void>();

  protected readonly iconName = computed(() => this.icon() ?? ICONS[this.variant()]);
}
