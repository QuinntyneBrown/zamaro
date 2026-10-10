import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { type Params, RouterLink } from '@angular/router';

export interface Crumb {
  label: string;
  /** A route; the last crumb is the current page and is never a link. */
  link?: string;
  queryParams?: Params;
}

/**
 * Where the page sits (docs/design-system/components/breadcrumb): "Discover · Sat 14 Nov / Abigail
 * Mensah". The last crumb is plain text with `aria-current="page"`.
 */
@Component({
  selector: 'zm-breadcrumb',
  imports: [RouterLink],
  template: `<nav [attr.aria-label]="label()">
    <ol class="breadcrumb">
      @for (crumb of crumbs(); track $index; let last = $last) {
        <li [attr.aria-current]="last ? 'page' : null">
          @if (!last && crumb.link) {
            <a [routerLink]="crumb.link" [queryParams]="crumb.queryParams">{{ crumb.label }}</a>
          } @else {
            {{ crumb.label }}
          }
        </li>
      }
    </ol>
  </nav>`,
  styles: `
    .breadcrumb {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--space-2);
      list-style: none;
      padding: 0;
      margin: 0;
      font: var(--text-stub);
      text-transform: uppercase;
    }

    .breadcrumb li {
      display: inline-flex;
      align-items: center;
      min-height: var(--target-min);
    }

    .breadcrumb li + li::before {
      content: '/';
      content: '/' / '';
      margin-right: var(--space-2);
    }

    .breadcrumb a {
      color: inherit;
    }

    .breadcrumb a:hover {
      background: var(--color-accent-subtle);
    }

    :host-context(.on-stage) .breadcrumb a:hover {
      background: none;
      color: var(--color-accent-on-stage);
    }

    .breadcrumb [aria-current='page'] {
      font-weight: var(--font-weight-bold);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Breadcrumb {
  readonly crumbs = input.required<readonly Crumb[]>();
  /** The navigation landmark's name: "Breadcrumb". */
  readonly label = input('Breadcrumb');
}
