import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type StepStatus = 'upcoming' | 'current' | 'complete';

export interface StepItem {
  /** "Pick your date". */
  title: string;
  /** "You only see artists who are free that day and will drive to you." */
  description?: string;
  status?: StepStatus;
  /** "Done", "Now" or "Next", so the state is said in words and not only by colour. */
  statusLabel?: string;
}

/**
 * Three to five framed, numbered panels read like a set list's running order
 * (docs/design-system/components/steps): "How booking works" on Discover, or how far one request
 * has got. The numbers come from a CSS counter, never the copy. The page owns the section and its
 * heading; `label` names a progress list that has none.
 */
@Component({
  selector: 'zm-steps',
  template: `<ol class="steps" [attr.aria-label]="label() || null">
    @for (item of items(); track $index; let i = $index) {
      <li
        [attr.aria-current]="i === currentIndex() ? 'step' : null"
        [attr.data-status]="item.status === 'complete' ? 'complete' : null"
      >
        <div>
          @if (item.statusLabel) {
            <p class="overline" [class.text-muted]="i !== currentIndex()">{{ item.statusLabel }}</p>
          }
          @switch (headingLevel()) {
            @case (2) {
              <h2>{{ item.title }}</h2>
            }
            @case (4) {
              <h4>{{ item.title }}</h4>
            }
            @default {
              <h3>{{ item.title }}</h3>
            }
          }
          @if (item.description) {
            <p>{{ item.description }}</p>
          }
        </div>
      </li>
    }
  </ol>`,
  styles: `
    :host {
      display: block;
    }

    .steps {
      display: grid;
      gap: 0;
      list-style: none;
      padding: 0;
      counter-reset: step;
      border: var(--border-width-thick) solid var(--color-border-strong);
    }

    .steps > li {
      counter-increment: step;
      display: grid;
      grid-template-columns: auto minmax(0, 1fr);
      gap: var(--space-5);
      padding: var(--space-5);
      background: var(--color-bg-surface);
    }

    .steps > li + li {
      border-top: var(--border-width-thick) solid var(--color-border-strong);
    }

    .steps > li::before {
      content: counter(step, decimal-leading-zero);
      align-self: start;
      padding: var(--space-1) var(--space-2);
      font: var(--text-figure-lg);
      line-height: var(--line-height-tight);
      color: var(--color-fg-on-accent);
      background: var(--color-accent);
      border: var(--border-width-thick) solid var(--color-border-on-accent);
    }

    .steps > li[data-status='complete']::before {
      color: var(--color-fg-inverse);
      background: var(--color-bg-inverse);
      border-color: var(--color-bg-inverse);
    }

    .steps > li[aria-current='step'] {
      box-shadow: inset 0 calc(var(--border-width-poster) * -1) 0 var(--color-accent);
    }

    h2,
    h3,
    h4 {
      margin-bottom: var(--space-2);
      font: var(--text-h4);
      text-transform: uppercase;
    }

    .overline {
      font: var(--text-overline);
      letter-spacing: var(--letter-spacing-stamp);
      text-transform: uppercase;
    }

    .text-muted {
      color: var(--color-fg-muted);
    }

    @media (min-width: 36rem) {
      .steps > li {
        padding: var(--space-8);
      }
    }

    @media (min-width: 62rem) {
      .steps {
        grid-auto-flow: column;
        grid-auto-columns: minmax(0, 1fr);
      }

      .steps > li + li {
        border-top: 0;
        border-left: var(--border-width-thick) solid var(--color-border-strong);
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Steps {
  readonly items = input.required<readonly StepItem[]>();
  /** Names a progress list ("Your request to Abigail Mensah"); the explainer's heading names it. */
  readonly label = input<string>();
  /** One below the section heading. */
  readonly headingLevel = input<2 | 3 | 4>(3);

  /** The first item marked current, or -1. */
  protected readonly currentIndex = computed(() =>
    this.items().findIndex((item) => item.status === 'current'),
  );
}
