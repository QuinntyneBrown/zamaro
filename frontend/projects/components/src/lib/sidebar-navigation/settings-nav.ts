import { Location } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  isDevMode,
  model,
  viewChild,
} from '@angular/core';

export interface SettingsSection {
  /** The target element's `id`: "church". */
  id: string;
  /** "Church". */
  label: string;
}

/** How long a link's smooth scroll may take before the observer tracks the page again. */
const SCROLL_SETTLE_MS = 1000;

/**
 * Jumps between the sections of one long settings form (docs/specs/components/sidebar-navigation):
 * a scrolling row below LG and a sticky column from LG. The current link follows the section under
 * the line just below the top bar (D-3); activating a link scrolls to its section, focuses it and
 * puts its fragment in the address without a new history entry (D-4, D-5).
 */
@Component({
  selector: 'zm-settings-nav',
  template: `<nav #nav class="settings-nav" [attr.aria-label]="label()">
    @for (section of sections(); track section.id) {
      <a
        [href]="base() + '#' + section.id"
        [attr.aria-current]="section.id === current() ? 'true' : null"
        (click)="activate($event, section.id)"
        >{{ section.label }}</a
      >
    }
  </nav>`,
  styles: `
    :host {
      display: block;
      min-width: 0;
    }

    .settings-nav {
      display: flex;
      gap: var(--space-1);
      overflow-x: auto;
      scrollbar-width: none;
      /* Room for the focus ring inside the scroll box (AC-18), taken back from the layout. */
      padding: calc(var(--focus-ring-width) + var(--focus-ring-offset));
      margin: calc((var(--focus-ring-width) + var(--focus-ring-offset)) * -1);
    }

    a {
      display: flex;
      align-items: center;
      min-height: var(--target-comfortable);
      padding: 0 var(--space-3);
      color: var(--color-fg-muted);
      font: var(--text-label);
      text-transform: uppercase;
      letter-spacing: var(--letter-spacing-wide);
      text-decoration: none;
      white-space: nowrap;
    }

    a:hover {
      background: var(--color-accent-subtle);
      color: var(--color-fg-default);
    }

    a[aria-current='true'] {
      color: var(--color-fg-default);
      box-shadow: inset 0 calc(var(--border-width-poster) * -1) 0 var(--color-accent);
    }

    @media (min-width: 62rem) {
      :host {
        position: sticky;
        top: calc(var(--layout-topbar-height) + var(--space-6));
      }

      .settings-nav {
        flex-direction: column;
      }

      a[aria-current='true'] {
        box-shadow: inset var(--border-width-poster) 0 0 var(--color-accent);
      }
    }

    @media (forced-colors: active) {
      a[aria-current='true'] {
        border-inline-start: var(--border-width-poster) solid CanvasText;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsNav {
  /** The landmark's name: "Settings sections". */
  readonly label = input.required<string>();
  /** In page order; each `id` names an element on the page. */
  readonly sections = input.required<readonly SettingsSection[]>();
  /** The section in view; the page may set it, for example to the first section with an error. */
  readonly current = model<string>('');

  private readonly location = inject(Location);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly nav = viewChild.required<ElementRef<HTMLElement>>('nav');
  private observer?: IntersectionObserver;
  private settling?: ReturnType<typeof setTimeout>;

  constructor() {
    afterNextRender(() => this.start());
    inject(DestroyRef).onDestroy(() => {
      this.observer?.disconnect();
      clearTimeout(this.settling);
    });
    // Keeps the current link in view inside the scrolling row, without scrolling the page.
    effect(() => {
      const id = this.current();
      const nav = this.nav().nativeElement;
      const link = [...nav.querySelectorAll('a')].find((a) => a.hash === `#${id}`);
      if (!link || nav.scrollWidth <= nav.clientWidth) return;
      const start = link.offsetLeft - nav.offsetLeft;
      if (start < nav.scrollLeft || start + link.offsetWidth > nav.scrollLeft + nav.clientWidth) {
        nav.scrollLeft = start;
      }
    });
  }

  /** The page's path and query, for each link's `href`. */
  protected base(): string {
    return this.location.path(false).split('#')[0];
  }

  protected activate(event: MouseEvent, id: string): void {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.button !== 0) return;
    const target = this.document().getElementById(id);
    if (!target) return;
    event.preventDefault();
    this.current.set(id);
    this.pauseTracking();
    const reduce = this.window()?.matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
    this.location.replaceState(`${this.base()}#${id}`);
  }

  private start(): void {
    const elements = this.sections()
      .map(({ id }) => {
        const element = this.document().getElementById(id);
        if (!element && isDevMode()) console.error(`zm-settings-nav: no element with id "${id}".`);
        return element;
      })
      .filter((element): element is HTMLElement => element !== null);

    const fragment = this.location.path(true).split('#')[1];
    if (fragment && this.sections().some(({ id }) => id === fragment)) {
      this.current.set(fragment);
      this.pauseTracking();
      this.document().getElementById(fragment)?.scrollIntoView({ block: 'start' });
    } else if (!this.current()) {
      this.current.set(this.sections()[0]?.id ?? '');
    }

    if (typeof IntersectionObserver === 'undefined') return;
    const line = this.line();
    this.observer = new IntersectionObserver(() => this.track(elements), {
      rootMargin: `-${line}px 0px 0px 0px`,
      threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
    });
    elements.forEach((element) => this.observer!.observe(element));
  }

  /** The current section: the last whose top has passed the line, or the last at the page's end. */
  private track(elements: HTMLElement[]): void {
    if (this.settling || !elements.length) return;
    const win = this.window()!;
    const doc = this.document().documentElement;
    const atEnd = win.innerHeight + win.scrollY >= doc.scrollHeight - 2;
    const line = this.line();
    let current = elements[0];
    for (const element of elements) {
      if (element.getBoundingClientRect().top <= line + 1) current = element;
    }
    this.current.set(atEnd ? elements[elements.length - 1].id : current.id);
  }

  /** The top bar's height plus `--space-6`, where the sticky column sits. */
  private line(): number {
    const style = getComputedStyle(this.document().documentElement);
    const rem = parseFloat(style.fontSize) || 16;
    const px = (value: string): number =>
      value.trim().endsWith('rem') ? parseFloat(value) * rem : parseFloat(value) || 0;
    return (
      px(style.getPropertyValue('--layout-topbar-height')) + px(style.getPropertyValue('--space-6'))
    );
  }

  private pauseTracking(): void {
    clearTimeout(this.settling);
    this.settling = setTimeout(() => (this.settling = undefined), SCROLL_SETTLE_MS);
  }

  private document(): Document {
    return this.host.nativeElement.ownerDocument;
  }

  private window(): Window | null {
    return this.document().defaultView;
  }
}
