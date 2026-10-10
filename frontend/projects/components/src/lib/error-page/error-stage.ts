import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Alert } from '../alert/alert';

/**
 * A page or profile that failed to load (docs/specs/components/error-page.md): the stage with the
 * breadcrumb, the kicker and a plain-words title, then the recovery alert below it. Project the
 * breadcrumb into `[slot=breadcrumb]`, the alert's message as content and its buttons into
 * `[slot=actions]`.
 */
@Component({
  selector: 'zm-error-stage',
  imports: [Alert],
  template: `<section class="poster on-stage" [attr.aria-labelledby]="headingId()">
      <div class="container stack stack--lg">
        <div class="error-stage__crumbs"><ng-content select="[slot=breadcrumb]" /></div>
        <p class="overline poster__kicker">{{ kicker() }}</p>
        <h1
          tabindex="-1"
          [id]="headingId()"
          [class.artist-poster__name]="headline() === 'name'"
          [class.error-poster]="headline() === 'display'"
        >
          @if (strike()) {
            <span class="strike" aria-hidden="true">{{ strike() }}</span>
          }
          {{ heading() }}
        </h1>
        @if (subtitle()) {
          <p class="poster__sub">{{ subtitle() }}</p>
        }
        @if (reference()) {
          <p class="error-code">{{ reference() }}</p>
        }
      </div>
    </section>
    <div class="container page-error">
      <zm-alert [variant]="alertTone()" [heading]="alertHeading()">
        <ng-content />
        <div slot="actions" class="error-stage__actions">
          <ng-content select="[slot=actions]" />
        </div>
      </zm-alert>
    </div>`,
  styleUrls: ['../poster/poster-frame.scss'],
  styles: `
    :host {
      display: block;
    }

    .error-stage__crumbs:empty {
      display: none;
    }

    .error-stage__actions {
      display: contents;
    }

    .artist-poster__name {
      font: var(--text-poster);
      text-transform: uppercase;
      overflow-wrap: anywhere;
    }

    .error-poster {
      font: var(--text-display);
      text-transform: uppercase;
      color: inherit;
    }

    .error-poster .strike {
      text-decoration: line-through;
      text-decoration-thickness: 0.08em;
      text-decoration-color: var(--color-accent-on-stage);
    }

    .poster__sub {
      color: var(--color-fg-on-stage-muted);
      font: var(--text-body-lg);
    }

    .error-code {
      font: var(--text-overline);
      letter-spacing: var(--letter-spacing-stamp);
      text-transform: uppercase;
      color: var(--color-fg-on-stage-muted);
      overflow-wrap: anywhere;
    }

    .page-error {
      padding-block: var(--space-10);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorStage {
  /** "Show postponed". */
  readonly kicker = input.required<string>();
  /** "This profile didn’t load". */
  readonly heading = input.required<string>();
  /** `name` for a page whose context is known; `display` for the large error poster. */
  readonly headline = input<'name' | 'display'>('name');
  /** With `display`: a struck word before the heading. */
  readonly strike = input<string>();
  readonly subtitle = input<string>();
  /** "Reference 7f3c9a2e-… · Fri 9 Oct, 2:32 p.m.". */
  readonly reference = input<string>();
  readonly headingId = input('error-title');
  readonly alertTone = input<'danger' | 'info'>('danger');
  /** "We couldn’t reach the artist’s page". */
  readonly alertHeading = input.required<string>();
}
