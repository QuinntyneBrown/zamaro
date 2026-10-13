import { booleanAttribute, ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { type Params, RouterLink, RouterLinkActive } from '@angular/router';
import { AvatarButton } from '../avatar/avatar-button';
import { Badge } from '../badge/badge';
import type { AvatarKind } from '../avatar/avatar-initials';
import { Button } from '../button/button';
import { Icon } from '../icon/icon';

/** A link in the bar: the primary links and the workspace shortcut (top-bar CRD). */
export interface TopBarLinkBase {
  label: string;
  link: string | readonly unknown[];
  fragment?: string;
  queryParams?: Params;
}

export interface TopBarLink extends TopBarLinkBase {
  /** A count after the label; 0, null or undefined renders no badge. */
  count?: number | null;
  /** Visually hidden after the count: "awaiting reply", "waiting", "held", "reported". */
  countLabel?: string;
}

/** Public: guests and bookers. Workspace: the artist area and the admin application (role tag, five links, compact until XL). */
export type TopBarVariant = 'public' | 'workspace';

/** The signed-in person behind the avatar button. */
export interface TopBarAccount {
  /** "Naomi Fraser": the avatar's initials come from it. */
  name: string;
  /** "Account menu for Naomi Fraser". */
  label: string;
  kind?: AvatarKind;
}

/** The Saved link and its count, for a signed-in booker (top-bar CRD). */
export interface TopBarSaved {
  /** "Saved". */
  label: string;
  /** "/saved". */
  link: string | readonly unknown[];
  /** 0 renders no badge. */
  count: number;
  /** Visually hidden after the count: "artists". */
  countLabel: string;
}

/** The link for someone signed out: "Sign in", or "Create account" shortened to "Sign up". */
export interface TopBarAuth {
  label: string;
  /** Shown below 480 px instead of `label`. */
  shortLabel?: string;
  link: string | readonly unknown[];
  /** `{ returnUrl }`, so signing in returns to the page the person was on (top-bar D-14). */
  queryParams?: Params;
}

/**
 * The sticky header on the charcoal stage (docs/design-system/components/top-bar). From LG it shows
 * the primary links and the theme toggle; below LG a menu button opens the navigation drawer instead.
 * At the right end it shows the signed-in person's avatar, or the signed-out link.
 */
@Component({
  selector: 'zm-top-bar',
  imports: [AvatarButton, Badge, Button, Icon, RouterLink, RouterLinkActive],
  template: `<header class="topbar" [class.topbar--workspace]="variant() === 'workspace'">
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
    @if (role()) {
      <span class="topbar__role">{{ role() }}</span>
    }
    <nav class="topbar__nav" [attr.aria-label]="navLabel()">
      @for (item of links(); track item.label) {
        <a
          class="nav-link"
          [routerLink]="item.link"
          [fragment]="item.fragment"
          [queryParams]="item.queryParams"
          routerLinkActive
          ariaCurrentWhenActive="page"
          [routerLinkActiveOptions]="exactMatch"
          >{{ item.label }}
          @if (item.count) {
            <zm-badge variant="count"
              >{{ item.count }}<span class="visually-hidden"> {{ item.countLabel }}</span></zm-badge
            >
          }
        </a>
      }
    </nav>
    <span class="topbar__spacer"></span>
    @if (shortcut(); as shortcut) {
      <a
        class="nav-link topbar__link"
        [routerLink]="shortcut.link"
        [fragment]="shortcut.fragment"
        [queryParams]="shortcut.queryParams"
        >{{ shortcut.label }}</a
      >
    }
    @if (variant() === 'public' && saved(); as s) {
      <a
        class="nav-link topbar__saved"
        [routerLink]="s.link"
        routerLinkActive
        ariaCurrentWhenActive="page"
        ><zm-icon name="heart" /><span class="nav-link__text">{{ s.label }}</span>
        @if (s.count > 0) {
          <zm-badge variant="count"
            >{{ s.count }}<span class="visually-hidden"> {{ s.countLabel }}</span></zm-badge
          >
        }
      </a>
    }
    <zm-button
      class="topbar__theme"
      variant="ghost"
      iconOnly
      [pressed]="themePressed()"
      (click)="themeToggled.emit()"
      ><zm-icon name="moon" /><span class="visually-hidden">{{ themeLabel() }}</span></zm-button
    >
    @if (account(); as account) {
      <zm-avatar-button
        [name]="account.name"
        [kind]="account.kind ?? 'person'"
        [label]="account.label"
        [expanded]="accountExpanded()"
        [controls]="accountControls()"
        (click)="accountOpened.emit()"
      />
    } @else if (auth(); as auth) {
      <a
        class="nav-link"
        [class.topbar__auth]="!!auth.shortLabel"
        [routerLink]="auth.link"
        [queryParams]="auth.queryParams"
      >
        @if (auth.shortLabel) {
          <span class="topbar__auth-short">{{ auth.shortLabel }}</span
          ><span class="topbar__auth-long">{{ auth.label }}</span>
        } @else {
          {{ auth.label }}
        }
      </a>
    }
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

    /* The workspace's role tag after the brand: "Artists", "Admin" (top-bar CRD). */
    .topbar__role {
      display: inline-flex;
      align-items: center;
      padding: var(--space-0-5) var(--space-2);
      border: var(--border-width-hairline) solid currentColor;
      font: var(--text-overline);
      letter-spacing: var(--letter-spacing-stamp);
      text-transform: uppercase;
      color: var(--color-fg-on-stage-muted);
    }

    .topbar__nav {
      display: none;
      gap: var(--space-1);
    }

    /* The workspace shortcut ("View public profile") joins the bar only from 2XL. */
    .topbar__link {
      display: none;
    }

    .topbar__spacer {
      flex: 1;
    }

    .topbar__saved {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
    }

    /* Below LG the Saved link is the heart and the count; its name stays for assistive technology. */
    .topbar__saved .nav-link__text {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0 0 0 0);
      white-space: nowrap;
    }

    @media (min-width: 62rem) {
      .topbar__saved .nav-link__text {
        position: static;
        width: auto;
        height: auto;
        overflow: visible;
        clip: auto;
      }
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

    /* The links after the spacer never wrap (top-bar D-10). */
    .topbar__spacer ~ .nav-link {
      white-space: nowrap;
    }

    .topbar__auth-long {
      display: none;
    }

    @media (min-width: 30rem) {
      .topbar__auth-short {
        display: none;
      }

      .topbar__auth-long {
        display: inline;
      }
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

      /* Five workspace links do not fit at LG: the workspace bar stays compact until XL. */
      .topbar--workspace .topbar__nav {
        display: none;
      }

      .topbar--workspace .topbar__menu {
        display: inline-flex;
      }
    }

    @media (min-width: 75rem) {
      .topbar--workspace .topbar__nav {
        display: flex;
      }

      .topbar--workspace .topbar__menu {
        display: none;
      }
    }

    @media (min-width: 96rem) {
      .topbar--workspace .topbar__link {
        display: inline-flex;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopBar {
  /** `workspace` adds `.topbar--workspace`: the links collapse until XL and Saved never renders. */
  readonly variant = input<TopBarVariant>('public');
  /** The brand name, which is also the home link's accessible name. */
  readonly brand = input.required<string>();
  readonly homeLink = input<string | readonly unknown[]>('/');
  /** The role tag after the brand on a workspace bar: "Artists", "Admin". Empty renders none. */
  readonly role = input('');
  /** The workspace shortcut, shown from 2XL: "View public profile". */
  readonly shortcut = input<TopBarLinkBase | null>(null);
  readonly navLabel = input.required<string>();
  readonly links = input.required<readonly TopBarLink[]>();
  readonly menuLabel = input.required<string>();
  readonly menuExpanded = input(false, { transform: booleanAttribute });
  /** Id of the drawer the menu button opens. */
  readonly menuControls = input<string>();
  /** The toggle's constant accessible name ("Dark theme"); its state is `themePressed`. */
  readonly themeLabel = input.required<string>();
  readonly themePressed = input(false, { transform: booleanAttribute });
  /** Signed in: the avatar button. Null shows `auth` instead. */
  readonly account = input<TopBarAccount | null>(null);
  /** The Saved link, signed-in bookers only. */
  readonly saved = input<TopBarSaved | null>(null);
  /** The avatar's `aria-expanded`: true while the account menu is open. */
  readonly accountExpanded = input(false, { transform: booleanAttribute });
  /** Id of the account menu the avatar opens. */
  readonly accountControls = input<string>();
  /** Signed out: "Sign in". Ignored while `account` is set. */
  readonly auth = input<TopBarAuth | null>(null);

  readonly menuOpened = output<void>();
  readonly accountOpened = output<void>();
  readonly themeToggled = output<void>();

  protected readonly exactMatch = {
    paths: 'exact',
    queryParams: 'ignored',
    fragment: 'exact',
    matrixParams: 'ignored',
  } as const;
}
