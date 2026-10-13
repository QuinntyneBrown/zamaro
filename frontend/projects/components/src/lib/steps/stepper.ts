import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  type ElementRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';

/** One step of a multi-page form (docs/specs/components/steps, stepper). */
export interface StepperStep {
  /** "About you". */
  title: string;
  /** `data-state="done"`. */
  done?: boolean;
  /** `data-state="invalid"`; wins over done. */
  invalid?: boolean;
  /** `aria-current="step"`; at most one. */
  current?: boolean;
  /** A route back to the step's page; rendered only when the step is not current. */
  link?: string | unknown[];
}

/**
 * The row of numbered stubs over a multi-page form (docs/specs/components/steps): where the
 * applicant is, which steps are done or need fixing, and a way back to each done step. A one-line
 * row that scrolls inside itself on phones.
 */
@Component({
  selector: 'zm-stepper',
  imports: [RouterLink],
  template: `<ol
    #row
    class="stepper"
    [attr.aria-label]="label()"
    [attr.tabindex]="overflows() ? 0 : null"
  >
    @for (step of steps(); track $index) {
      <li
        class="stepper__step"
        [attr.aria-current]="step.current ? 'step' : null"
        [attr.data-state]="step.invalid ? 'invalid' : step.done ? 'done' : null"
      >
        @if (step.link && !step.current) {
          <a [routerLink]="step.link" [attr.aria-label]="step.title + suffixFor(step)">{{
            step.title
          }}</a>
        } @else {
          {{ step.title }}
          @if (suffixFor(step)) {
            <span class="visually-hidden">{{ suffixFor(step) }}</span>
          }
        }
      </li>
    }
  </ol>`,
  styles: `
    :host {
      display: block;
      min-width: 0;
      max-width: 100%;
    }

    .stepper {
      display: flex;
      gap: var(--space-2);
      list-style: none;
      margin: 0;
      padding: var(--space-1) 0;
      counter-reset: st;
      overflow-x: auto;
      scrollbar-width: none;
    }

    /* An overflowing row is a tab stop, so the keyboard can scroll it (D-7). */
    .stepper:focus-visible {
      outline: var(--focus-ring-width) solid var(--color-focus-ring);
      outline-offset: var(--focus-ring-offset);
    }

    .stepper__step {
      counter-increment: st;
      position: relative;
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-2) var(--space-3);
      min-height: var(--target-comfortable);
      background: var(--color-bg-surface);
      color: var(--color-fg-muted);
      border: var(--border-width-thick) solid var(--color-border-strong);
      font: var(--text-stub);
      text-transform: uppercase;
      white-space: nowrap;
    }

    .stepper__step::before {
      content: counter(st, decimal-leading-zero);
      font: var(--font-weight-regular) var(--font-size-xl) / 1 var(--font-family-display);
      color: var(--color-fg-default);
    }

    .stepper__step a {
      color: inherit;
      text-decoration: none;
    }

    /* The whole stub is the target (D-5). */
    .stepper__step a::after {
      content: '';
      position: absolute;
      inset: 0;
    }

    .stepper__step a:focus-visible {
      outline: none;
    }

    .stepper__step:has(a:focus-visible) {
      outline: var(--focus-ring-width) solid var(--color-focus-ring);
      outline-offset: var(--focus-ring-offset);
      box-shadow: 0 0 0 var(--focus-ring-offset) var(--color-bg-canvas);
    }

    .stepper__step[aria-current='step'] {
      background: var(--color-accent);
      color: var(--color-fg-on-accent);
      border-color: var(--color-fg-on-accent);
    }

    .stepper__step[aria-current='step']::before {
      color: inherit;
    }

    .stepper__step[data-state='done'] {
      background: var(--color-fg-default);
      color: var(--color-bg-canvas);
      border-color: var(--color-fg-default);
    }

    .stepper__step[data-state='done']::before {
      content: '✓';
      color: inherit;
    }

    .stepper__step[data-state='invalid'] {
      border-color: var(--color-danger-border);
      color: var(--color-danger-fg);
    }

    /* Current and invalid: the ink label stays readable on yellow (D-6). */
    .stepper__step[aria-current='step'][data-state='invalid'] {
      color: var(--color-fg-on-accent);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Stepper {
  readonly steps = input.required<readonly StepperStep[]>();
  /** "Application steps". */
  readonly label = input.required<string>();
  /** ", done": after a done step's title, in its link name or visually hidden. */
  readonly doneSuffix = input('');
  /** ", needs fixing": the same for an invalid step. */
  readonly invalidSuffix = input('');

  private readonly row = viewChild.required<ElementRef<HTMLOListElement>>('row');
  /** True when the steps are wider than the row, which then scrolls and takes focus (D-7). */
  protected readonly overflows = signal(false);

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const row = this.row().nativeElement;
      this.measure(row);
      this.revealCurrent(row);
      if (typeof ResizeObserver === 'undefined') return;
      const observer = new ResizeObserver(() => this.measure(row));
      observer.observe(row);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  private measure(row: HTMLOListElement): void {
    this.overflows.set(row.scrollWidth > row.clientWidth + 1);
  }

  /** Scrolls the current step into the row without moving the page (D-7). */
  private revealCurrent(row: HTMLOListElement): void {
    const current = row.querySelector<HTMLElement>('[aria-current="step"]');
    if (!current) return;
    const left = current.offsetLeft - row.offsetLeft;
    const right = left + current.offsetWidth;
    if (left < row.scrollLeft) row.scrollLeft = left;
    else if (right > row.scrollLeft + row.clientWidth) row.scrollLeft = right - row.clientWidth;
  }

  protected suffixFor(step: StepperStep): string {
    if (step.invalid) return this.invalidSuffix();
    return step.done ? this.doneSuffix() : '';
  }
}
