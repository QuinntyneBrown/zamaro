import type { Signal } from '@angular/core';
import type { IconName } from '../icon/icon';

export type ToastVariant = 'success' | 'info' | 'warning' | 'danger';

/** Why a toast closed. */
export type ToastDismissal = 'timeout' | 'close' | 'action' | 'replaced' | 'programmatic';

/** What a caller passes to `ToastService.show`. Every string arrives translated (L2-111). */
export interface ToastOptions {
  /** `success` by default. A danger toast has no timer. */
  variant?: ToastVariant;
  /** The announcement, complete on its own: "Link copied", "Saved Luz Viva". */
  title: string;
  /** The overline naming the event or tone: "Shared", "Saved", "Heads up". */
  kind?: string;
  /** One sentence with the real date, time or amount, already formatted. */
  text?: string;
  /** Overrides the variant's icon. */
  icon?: IconName;
  /** Up to two actions: "Undo", "Try again", a link such as "View saved". */
  actions?: readonly ToastAction[];
  /** The close button's name: "Dismiss: Link copied". */
  dismissLabel: string;
  /** No timer and no bar: the toast stays until acted on or dismissed. Only for the idle-session warning (L2-066). */
  persistent?: boolean;
  /** A toast with the same key as a visible one replaces it in place and restarts its timer. */
  key?: string;
  /** Where focus returns if the toast closes with focus inside it; `document.activeElement` by default. */
  origin?: HTMLElement | null;
}

/** A button or link in a toast (toast CRD). */
export interface ToastAction {
  /** One verb: "Undo", "Try again", "View saved". */
  label: string;
  /** Extends the label and starts with it: "Undo save Luz Viva". */
  ariaLabel?: string;
  /** A route: the toast closes as it navigates. */
  link?: string | readonly unknown[];
  /** A callback; a promise keeps the button busy until it settles, and a rejection keeps the toast. */
  run?: () => void | Promise<unknown>;
}

/** A shown toast, as its caller holds it. */
export interface ToastRef {
  /** Starts the leaving transition. */
  dismiss(): void;
  /** Null while the toast is open, then why it closed. */
  readonly dismissed: Signal<ToastDismissal | null>;
}
