import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Button } from '../button/button';
import { Icon } from '../icon/icon';

export interface TopBarLink {
  label: string;
  link: string;
  fragment?: string;
}

/**
 * The sticky header on the charcoal stage (docs/design-system/components/top-bar). From LG it shows
 * the primary links and the theme toggle; below LG a menu button opens the navigation drawer instead.
 */
@Component({
  selector: 'zm-top-bar',
  imports: [Button, Icon, RouterLink, RouterLinkActive],
  template: `<header class="topbar">
    <zm-button
      class="topbar__menu"
      variant="ghost"
      iconOnly
      [label]="menuLabel()"
      [expanded]="menuExpanded()"
      [controls]="menuControls()"
      (click)="menuOpened.emit()"
      ><zm-icon name="menu"
    /></zm-button>
    <a class="topbar__brand" [routerLink]="homeLink()">
      <span class="brand-mark" aria-hidden="true"><zm-icon name="mic" size="sm" /></span
      >{{ brand() }}
    </a>
    <nav class="topbar__nav" [attr.aria-label]="navLabel()">
      @for (item of links(); track item.label) {
        <a
          class="nav-link"
          [routerLink]="item.link"
          [fragment]="item.fragment"
          routerLinkActive
          ariaCurrentWhenActive="page"
          [routerLinkActiveOptions]="exactMatch"
          >{{ item.label }}</a
        >
      }
    </nav>
    <span class="topbar__spacer"></span>
    <zm-button
      class="topbar__theme"
      variant="ghost"
      iconOnly
      [pressed]="themePressed()"
      (click)="themeToggled.emit()"
      ><zm-icon name="moon" /><span class="visually-hidden">{{ themeLabel() }}</span></zm-button
    >
  </header>`,
  styles: `
    .topbar {
      position: sticky;
      top: 0;
      z-index: var(--z-sticky);
      display: flex;
      align-items: center;
      gap: var(--space-3);
      min-height: var(--layout-topbar-height);
      padding: var(--space-3) var(--layout-margin);
      background: var(--color-bg-stage);
      color: var(--color-fg-on-stage);
      border-bottom: var(--border-width-poster) solid var(--color-accent);
    }

    .topbar :focus-visible {
      outline-color: var(--color-accent-on-stage);
      box-shadow: 0 0 0 var(--focus-ring-offset) var(--color-bg-stage);
    }

    .topbar__brand {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      color: inherit;
      text-decoration: none;
      font: var(--text-figure);
      letter-spacing: var(--letter-spacing-wide);
      text-transform: uppercase;
    }

    .topbar__brand:hover {
      background: none;
      color: var(--color-accent-on-stage);
    }

    .brand-mark {
      flex: none;
      display: inline-grid;
      place-items: center;
      width: 2rem;
      height: 2rem;
      background: var(--color-accent);
      color: var(--color-fg-on-accent);
    }

    .topbar__nav {
      display: none;
      gap: var(--space-1);
    }

    .topbar__spacer {
      flex: 1;
    }

    .topbar__menu {
      color: inherit;
    }

    /* From LG the toggle sits in the header; below LG it is the drawer's last item. */
    .topbar__theme {
      display: none;
    }

    .nav-link {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      min-height: var(--target-comfortable);
      padding: 0 var(--space-3);
      color: inherit;
      text-decoration: none;
      font: var(--text-label);
      text-transform: uppercase;
      letter-spacing: var(--letter-spacing-wide);
    }

    .nav-link:hover {
      background: transparent;
      color: var(--color-accent-on-stage);
    }

    .nav-link[aria-current='page'] {
      box-shadow: inset 0 calc(var(--border-width-thick) * -1 - 1px) 0 var(--color-accent-on-stage);
    }

    @media (max-width: 35.99rem) {
      .topbar {
        gap: var(--space-2);
      }

      .topbar__brand {
        font-size: var(--font-size-xl);
        min-width: 0;
      }

      .nav-link {
        padding-inline: var(--space-2);
      }
    }

    @media (min-width: 62rem) {
      .topbar__nav {
        display: flex;
      }

      .topbar__menu {
        display: none;
      }

      .topbar__theme {
        display: inline-flex;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopBar {
  /** The brand name, which is also the home link's accessible name. */
  readonly brand = input.required<string>();
  readonly homeLink = input('/');
  readonly navLabel = input.required<string>();
  readonly links = input.required<readonly TopBarLink[]>();
  readonly menuLabel = input.required<string>();
  readonly menuExpanded = input(false);
  /** Id of the drawer the menu button opens. */
  readonly menuControls = input<string>();
  /** The toggle's constant accessible name ("Dark theme"); its state is `themePressed`. */
  readonly themeLabel = input.required<string>();
  readonly themePressed = input(false);

  readonly menuOpened = output<void>();
  readonly themeToggled = output<void>();

  protected readonly exactMatch = {
    paths: 'exact',
    queryParams: 'ignored',
    fragment: 'exact',
    matrixParams: 'ignored',
  } as const;
}
