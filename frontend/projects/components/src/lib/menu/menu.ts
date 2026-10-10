import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Icon, type IconName } from '../icon/icon';

export type MenuItem =
  | { kind: 'link'; label: string; icon: IconName; link: string; fragment?: string }
  | { kind: 'toggle'; id: string; label: string; icon: IconName; pressed: boolean }
  | { kind: 'separator' };

/**
 * A plain list of menu items in Tab order (docs/design-system/components/menu): links, pressed
 * toggles and separators. The current page's link carries `aria-current="page"`.
 */
@Component({
  selector: 'zm-menu',
  imports: [Icon, RouterLink, RouterLinkActive],
  template: `<ul class="menu-list" role="list">
    @for (item of items(); track $index) {
      @switch (item.kind) {
        @case ('link') {
          <li>
            <a
              class="menu__item"
              [routerLink]="item.link"
              [fragment]="item.fragment"
              routerLinkActive
              ariaCurrentWhenActive="page"
              [routerLinkActiveOptions]="exactMatch"
              (click)="chosen.emit()"
              ><zm-icon [name]="item.icon" />{{ item.label }}</a
            >
          </li>
        }
        @case ('toggle') {
          <li>
            <button
              class="menu__item"
              type="button"
              [attr.aria-pressed]="item.pressed"
              (click)="toggled.emit(item.id)"
            >
              <zm-icon [name]="item.icon" />{{ item.label }}
            </button>
          </li>
        }
        @case ('separator') {
          <li class="menu__sep" aria-hidden="true"></li>
        }
      }
    }
  </ul>`,
  styles: `
    .menu-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
    }

    .menu__item {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      width: 100%;
      min-height: var(--target-comfortable);
      padding: 0 var(--space-3);
      font: var(--text-body-sm);
      text-align: left;
      text-decoration: none;
      color: var(--color-fg-default);
      background: transparent;
      border: 0;
      cursor: pointer;
    }

    .menu__item:hover,
    .menu__item:focus-visible {
      background: var(--color-accent-subtle);
      color: var(--color-fg-default);
      outline: none;
    }

    .menu__item:focus-visible {
      box-shadow: inset 0 0 0 var(--border-width-thick) var(--color-focus-ring);
    }

    .menu__item[aria-current='page'],
    .menu__item[aria-pressed='true'] {
      font-weight: var(--font-weight-bold);
      box-shadow: inset var(--border-width-poster) 0 0 var(--color-border-selected);
    }

    .menu__item[aria-pressed='true'] {
      --zm-icon-fill: currentColor;
    }

    .menu__sep {
      height: 0;
      margin: var(--space-1) 0;
      border-top: var(--border-width-hairline) solid var(--color-border-default);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Menu {
  readonly items = input.required<readonly MenuItem[]>();

  /** A link was followed; the opener usually closes the menu. */
  readonly chosen = output<void>();
  /** A toggle item was pressed; carries its `id`. */
  readonly toggled = output<string>();

  protected readonly exactMatch = {
    paths: 'exact',
    queryParams: 'ignored',
    fragment: 'exact',
    matrixParams: 'ignored',
  } as const;
}
