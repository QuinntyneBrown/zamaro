import {
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { Button } from '../button/button';
import { ButtonLink } from '../button/button-link';
import { Icon } from '../icon/icon';
import type { ToastAction } from './toast.types';
import type { ToastContent } from './toast.service';

/**
 * One toast slip (docs/design-system/components/toast): icon, kind, title, text, the dismiss button
 * and the timer bar. Internal to the library: `zm-toast-region` renders it from `ToastService`.
 */
@Component({
  selector: 'zm-toast',
  imports: [Button, ButtonLink, Icon],
  host: {
    '[class]': "'toast toast--' + toast().variant",
    '[attr.data-state]': 'state()',
    '[attr.data-paused]': "paused() ? '' : null",
    '(mouseenter)': 'hover.set(true); report()',
    '(mouseleave)': 'hover.set(false); report()',
    '(focusin)': 'focused.set(true); report()',
    '(focusout)': 'focusLeft($event)',
    '(keydown.escape)': 'closed.emit()',
    '(transitionend)': 'transitionEnded($event)',
  },
  template: `<zm-icon [name]="toast().icon" />
    <div class="toast__body">
      @if (toast().kind; as kind) {
        <p class="toast__kind">{{ kind }}</p>
      }
      <p class="toast__title">{{ toast().title }}</p>
      @if (toast().text; as text) {
        <p class="toast__text">{{ text }}</p>
      }
      @if (toast().actions.length) {
        <div class="toast__actions">
          @for (action of toast().actions; track action.label; let i = $index) {
            @if (action.link) {
              <zm-button-link size="sm" [link]="$any(action.link)" (click)="acted.emit()">{{
                action.label
              }}</zm-button-link>
            } @else {
              <zm-button
                size="sm"
                [label]="action.ariaLabel"
                [busy]="busyAction() === i"
                (click)="activate(action, i)"
                >{{ action.label }}</zm-button
              >
            }
          }
        </div>
      }
    </div>
    <button
      class="close"
      type="button"
      [attr.aria-label]="toast().dismissLabel"
      (click)="closed.emit()"
    >
      <zm-icon name="close" size="sm" />
    </button>
    @if (toast().timed) {
      @for (each of [run()]; track each) {
        <span class="toast__progress" aria-hidden="true"></span>
      }
    }`,
  styles: `
    :host {
      --toast-accent: var(--color-accent);
      position: relative;
      overflow: hidden;
      pointer-events: auto;
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto;
      gap: var(--space-3);
      align-items: start;
      padding: var(--space-4);
      color: var(--color-fg-inverse);
      background: var(--color-bg-inverse);
      border-left: var(--border-width-poster) solid var(--toast-accent);
      box-shadow: var(--shadow-2);
      animation: toast-in var(--duration-slow) var(--ease-enter);
    }

    :host(.toast--warning) {
      --toast-accent: var(--color-warning-border);
    }

    :host(.toast--danger) {
      --toast-accent: var(--color-danger-icon);
      color: var(--color-fg-default);
      background: var(--color-danger-bg);
      border: var(--border-width-thick) solid var(--color-danger-border);
      border-left-width: var(--border-width-poster);
    }

    :host([data-state='leaving']) {
      opacity: 0;
      translate: var(--space-8) 0;
      transition:
        opacity var(--duration-base) var(--ease-exit),
        translate var(--duration-base) var(--ease-exit);
    }

    @keyframes toast-in {
      from {
        opacity: 0;
        translate: 0 var(--space-4);
      }
    }

    :host > zm-icon {
      color: var(--toast-accent);
    }

    .toast__body {
      font: var(--text-body-sm);
    }

    .toast__kind {
      font: var(--text-overline);
      letter-spacing: var(--letter-spacing-stamp);
      text-transform: uppercase;
    }

    .toast__title {
      font: var(--text-label);
      letter-spacing: var(--letter-spacing-wide);
      text-transform: uppercase;
      overflow-wrap: anywhere;
    }

    .toast__text {
      font: var(--text-body-sm);
    }

    .toast__actions {
      display: flex;
      gap: var(--space-2);
      margin-top: var(--space-2);
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
      .close {
        width: var(--target-comfortable);
        height: var(--target-comfortable);
      }
    }

    /* Empties over the 5 seconds; stands still with the timer (toast CRD D-4). */
    .toast__progress {
      position: absolute;
      left: 0;
      bottom: 0;
      width: 100%;
      height: var(--border-width-thick);
      background: var(--toast-accent);
      transform-origin: left;
      animation: toast-timer 5s linear forwards;
    }

    :host([data-paused]) .toast__progress {
      animation-play-state: paused;
    }

    @keyframes toast-timer {
      to {
        transform: scaleX(0);
      }
    }

    /* A shrinking bar is motion; the timer itself is unchanged (toast CRD D-5). */
    @media (prefers-reduced-motion: reduce) {
      .toast__progress {
        display: none;
      }
    }

    @media (forced-colors: active) {
      :host {
        border: var(--border-width-thick) solid CanvasText;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Toast {
  readonly toast = input.required<ToastContent>();
  readonly run = input(0);
  readonly state = input<'visible' | 'leaving'>('visible');
  readonly paused = input(false);
  /** Where focus returns if the toast leaves with focus inside it. */
  readonly origin = input<HTMLElement | null>(null);

  /** The dismiss button or Escape. */
  readonly closed = output<void>();
  /** True while the pointer or focus is inside the slip. */
  readonly held = output<boolean>();
  /** The leaving transition ended. */
  readonly left = output<void>();
  /** An action was taken and the toast should close. */
  readonly acted = output<void>();

  /** The index of a `run` action whose promise has not settled. */
  protected readonly busyAction = signal<number | null>(null);

  protected activate(action: ToastAction, index: number): void {
    if (this.busyAction() !== null || !action.run) return;
    const result = action.run();
    if (!(result instanceof Promise)) {
      this.acted.emit();
      return;
    }
    this.busyAction.set(index);
    result.then(
      () => {
        this.busyAction.set(null);
        this.acted.emit();
      },
      () => this.busyAction.set(null),
    );
  }

  protected readonly hover = signal(false);
  protected readonly focused = signal(false);
  private host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private wasHeld = false;

  constructor() {
    effect(() => {
      if (this.state() === 'leaving') untracked(() => this.returnFocus());
    });
  }

  protected report(): void {
    const held = this.hover() || this.focused();
    if (held === this.wasHeld) return;
    this.wasHeld = held;
    this.held.emit(held);
  }

  protected focusLeft(event: FocusEvent): void {
    if (this.host.contains(event.relatedTarget as Node | null)) return;
    this.focused.set(false);
    this.report();
  }

  protected transitionEnded(event: TransitionEvent): void {
    if (event.target === this.host && event.propertyName === 'opacity') this.left.emit();
  }

  /** Back to the control that raised it, else the page's heading; never to `<body>` (toast CRD D-11). */
  private returnFocus(): void {
    const document = this.host.ownerDocument;
    if (!this.host.contains(document.activeElement)) return;
    for (const target of [
      this.origin(),
      document.querySelector<HTMLElement>('main h1'),
      document.querySelector<HTMLElement>('main'),
    ]) {
      if (!target?.isConnected) continue;
      target.focus();
      if (document.activeElement === target) return;
    }
  }
}
