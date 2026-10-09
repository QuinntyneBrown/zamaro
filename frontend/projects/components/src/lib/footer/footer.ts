import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

/** A footer entry: a route (`link`, optional `fragment`), an external `href`, or plain text. */
export interface FooterItem {
  label: string;
  link?: string;
  fragment?: string;
  href?: string;
}

export interface FooterColumn {
  heading: string;
  items: readonly FooterItem[];
}

/** The site footer on the charcoal stage (docs/design-system/components/footer). */
@Component({
  selector: 'zm-footer',
  imports: [RouterLink],
  template: `<footer class="footer on-stage">
    <div class="container footer__grid">
      <div class="stack">
        <p class="footer__word" aria-hidden="true">{{ word() }}</p>
        <p>{{ tagline() }}</p>
      </div>
      @for (column of columns(); track column.heading) {
        <div>
          <h2>{{ column.heading }}</h2>
          <ul>
            @for (item of column.items; track item.label) {
              <li>
                @if (item.link) {
                  <a [routerLink]="item.link" [fragment]="item.fragment">{{ item.label }}</a>
                } @else if (item.href) {
                  <a [href]="item.href">{{ item.label }}</a>
                } @else {
                  {{ item.label }}
                }
              </li>
            }
          </ul>
        </div>
      }
    </div>
  </footer>`,
  styles: `
    .footer {
      padding-block: var(--space-16) var(--space-24);
      border-top: var(--border-width-poster) solid var(--color-accent);
    }

    .footer a {
      color: inherit;
    }

    .footer a:hover {
      background: none;
      color: var(--color-accent-on-stage);
    }

    .footer__grid {
      display: grid;
      gap: var(--space-8);
    }

    /* The wordmark scales with its column so it never runs into the link columns beside it. */
    .footer__grid > :first-child {
      container-type: inline-size;
    }

    .footer__word {
      font: var(--text-display);
      font-size: min(var(--font-size-5xl), 26cqi);
      text-transform: uppercase;
      color: var(--color-accent-on-stage);
    }

    .footer ul {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: var(--space-3);
    }

    .footer h2 {
      font: var(--text-overline);
      letter-spacing: var(--letter-spacing-stamp);
      margin-bottom: var(--space-3);
    }

    @media (min-width: 48rem) {
      .footer__grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      .footer__grid > :first-child {
        grid-column: 1 / -1;
      }
    }

    @media (min-width: 62rem) {
      .footer__grid {
        grid-template-columns: minmax(0, 2fr) repeat(3, minmax(0, 1fr));
      }

      .footer__grid > :first-child {
        grid-column: auto;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Footer {
  /** The decorative wordmark, hidden from assistive technology. */
  readonly word = input.required<string>();
  readonly tagline = input.required<string>();
  readonly columns = input.required<readonly FooterColumn[]>();
}
