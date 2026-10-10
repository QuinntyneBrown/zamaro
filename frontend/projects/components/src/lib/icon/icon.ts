import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** 24-unit stroke paths from docs/design-system/foundations/iconography.html. Add one when a screen needs it. */
const ICONS = {
  'arrow-right': 'M4 12h15M13 6l6 6-6 6',
  close: 'M6 6l12 12M18 6 6 18',
  compass: 'M3 12a9 9 0 1 0 18 0a9 9 0 1 0-18 0M15 9l-2 5-4 1 2-5z',
  help: 'M3 12a9 9 0 1 0 18 0a9 9 0 1 0-18 0M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.7M12 17v.5',
  info: 'M3 12a9 9 0 1 0 18 0a9 9 0 1 0-18 0M12 11v6M12 7v.5',
  menu: 'M4 7h16M4 12h16M4 17h16',
  mic: 'M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM6 11a6 6 0 0 0 12 0M12 17v4M8 21h8',
  moon: 'M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z',
  refresh: 'M20 12a8 8 0 1 1-2.3-5.6M20 4v5h-5',
  warning: 'M12 3 2 21h20zM12 10v5M12 18v.5',
} as const;

export type IconName = keyof typeof ICONS;

/**
 * Decorative inline SVG icon. An icon-only control carries its own accessible name.
 * A parent fills it ("on" state) by setting `--zm-icon-fill: currentColor`.
 */
@Component({
  selector: 'zm-icon',
  template: `<svg
    class="icon"
    [class.icon--sm]="size() === 'sm'"
    [class.icon--lg]="size() === 'lg'"
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
  >
    <path [attr.d]="path()" />
  </svg>`,
  styles: `
    :host {
      display: contents;
    }

    .icon {
      width: 1.25rem;
      height: 1.25rem;
      flex: none;
      fill: var(--zm-icon-fill, none);
      stroke: currentColor;
      stroke-width: 2.25;
      stroke-linecap: square;
      stroke-linejoin: miter;
    }

    .icon--sm {
      width: 1rem;
      height: 1rem;
    }

    .icon--lg {
      width: 1.75rem;
      height: 1.75rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Icon {
  readonly name = input.required<IconName>();
  readonly size = input<'sm' | 'md' | 'lg'>('md');

  protected readonly path = computed(() => ICONS[this.name()]);
}
