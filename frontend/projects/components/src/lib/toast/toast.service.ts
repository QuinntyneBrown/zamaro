import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  inject,
  Injectable,
  type OnDestroy,
  PLATFORM_ID,
  type Signal,
  signal,
  type WritableSignal,
} from '@angular/core';
import type { IconName } from '../icon/icon';
import type {
  ToastAction,
  ToastDismissal,
  ToastOptions,
  ToastRef,
  ToastVariant,
} from './toast.types';

/** How long a timed toast stays while nothing pauses it (L2-109). */
export const TOAST_DURATION_MS = 5000;

/** Removes a leaving toast if its transition never reports the end. */
const LEAVE_FALLBACK_MS = 400;

const ICON_FOR: Record<ToastVariant, IconName> = {
  success: 'check',
  info: 'info',
  warning: 'warning',
  danger: 'warning',
};

/** A toast's copy and look, as the slip renders it. */
export interface ToastContent {
  variant: ToastVariant;
  icon: IconName;
  title: string;
  kind: string | null;
  text: string | null;
  actions: readonly ToastAction[];
  dismissLabel: string;
  /** Leaves after 5 seconds with a timer bar; danger and persistent toasts stay until dismissed. */
  timed: boolean;
}

/** One toast as `zm-toast-region` renders it. */
export interface ActiveToast {
  readonly id: number;
  readonly content: Signal<ToastContent>;
  /** Changes when the toast is replaced, so its timer bar starts again. */
  readonly run: Signal<number>;
  readonly state: Signal<'visible' | 'leaving'>;
  /** Pointer or focus inside it, or the tab hidden: the timer and its bar stand still. */
  readonly paused: Signal<boolean>;
  readonly origin: HTMLElement | null;
}

class Toast implements ActiveToast {
  readonly content: WritableSignal<ToastContent>;
  readonly run = signal(0);
  readonly state = signal<'visible' | 'leaving'>('visible');
  readonly paused = signal(false);
  readonly dismissed = signal<ToastDismissal | null>(null);
  /** Pointer or focus inside the slip. */
  held = false;
  remaining = TOAST_DURATION_MS;
  private startedAt = 0;
  private timer?: ReturnType<typeof setTimeout>;
  removal?: ReturnType<typeof setTimeout>;

  constructor(
    readonly id: number,
    readonly key: string | null,
    content: ToastContent,
    readonly origin: HTMLElement | null,
  ) {
    this.content = signal(content);
  }

  start(onTimeout: () => void): void {
    if (!this.content().timed || this.timer) return;
    this.startedAt = Date.now();
    this.timer = setTimeout(onTimeout, this.remaining);
  }

  stop(): void {
    if (!this.timer) return;
    clearTimeout(this.timer);
    this.timer = undefined;
    this.remaining -= Date.now() - this.startedAt;
  }
}

/**
 * Raises toasts in the one `zm-toast-region` the application shell renders (docs/specs/components/toast.md).
 * It owns the timers and focus return; no page renders `zm-toast` itself. Showing a toast never moves
 * focus. Built so far: timed and danger toasts, pausing, replacing by key and dismissing. Actions, the
 * stack of three with its queue, `persistent`, `update()` and holding toasts behind a modal dialog
 * come with their first callers.
 */
@Injectable({ providedIn: 'root' })
export class ToastService implements OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly toasts = signal<readonly Toast[]>([]);
  private nextId = 1;
  private pageHidden = false;

  /** The toasts on screen, newest first. */
  readonly visible: Signal<readonly ActiveToast[]> = this.toasts.asReadonly();

  private readonly onVisibilityChange = () => {
    this.pageHidden = this.document.visibilityState === 'hidden';
    for (const toast of this.toasts()) this.updatePause(toast);
  };

  constructor() {
    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      this.document.addEventListener('visibilitychange', this.onVisibilityChange);
    }
  }

  show(options: ToastOptions): ToastRef {
    const variant = options.variant ?? 'success';
    const content: ToastContent = {
      variant,
      icon: options.icon ?? ICON_FOR[variant],
      title: options.title,
      kind: options.kind ?? null,
      text: options.text ?? null,
      actions: (options.actions ?? []).slice(0, 2),
      dismissLabel: options.dismissLabel,
      timed: variant !== 'danger' && !options.persistent,
    };
    const same = options.key
      ? this.toasts().find((toast) => toast.key === options.key && toast.state() === 'visible')
      : undefined;
    if (same) {
      // Replaced in place: new copy and a fresh timer, and focus inside it stays put.
      same.stop();
      same.remaining = TOAST_DURATION_MS;
      same.content.set(content);
      same.run.update((run) => run + 1);
      this.updatePause(same);
      return this.refFor(same);
    }
    const origin =
      options.origin === undefined
        ? (this.document.activeElement as HTMLElement | null)
        : options.origin;
    const toast = new Toast(this.nextId++, options.key ?? null, content, origin);
    this.toasts.update((toasts) => [toast, ...toasts]);
    this.updatePause(toast);
    return this.refFor(toast);
  }

  /** Removes every toast (sign-out, a route to an error page). */
  dismissAll(): void {
    for (const toast of this.toasts()) this.close(toast, 'programmatic');
  }

  /** For the region: the pointer or focus entered or left a toast. */
  hold(active: ActiveToast, held: boolean): void {
    const toast = active as Toast;
    toast.held = held;
    this.updatePause(toast);
  }

  /** For the region: starts a toast's leaving transition. */
  close(active: ActiveToast, reason: ToastDismissal): void {
    const toast = active as Toast;
    if (toast.state() === 'leaving') return;
    toast.stop();
    toast.state.set('leaving');
    toast.dismissed.set(reason);
    toast.removal = setTimeout(() => this.remove(toast), LEAVE_FALLBACK_MS);
  }

  /** For the region: the leaving transition ended. */
  remove(active: ActiveToast): void {
    const toast = active as Toast;
    clearTimeout(toast.removal);
    this.toasts.update((toasts) => toasts.filter((each) => each !== toast));
  }

  ngOnDestroy(): void {
    this.document.removeEventListener('visibilitychange', this.onVisibilityChange);
    for (const toast of this.toasts()) {
      toast.stop();
      clearTimeout(toast.removal);
    }
  }

  private updatePause(toast: Toast): void {
    if (toast.state() === 'leaving') return;
    const paused = toast.held || this.pageHidden;
    toast.paused.set(paused);
    if (paused) toast.stop();
    else toast.start(() => this.close(toast, 'timeout'));
  }

  private refFor(toast: Toast): ToastRef {
    return {
      dismiss: () => this.close(toast, 'programmatic'),
      dismissed: toast.dismissed.asReadonly(),
    };
  }
}
