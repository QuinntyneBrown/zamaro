import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** 24-unit stroke paths from docs/design-system/foundations/iconography.html. Add one when a screen needs it. */
const ICONS = {
  'arrow-left': 'M20 12H5M11 6l-6 6 6 6',
  'arrow-right': 'M4 12h15M13 6l6 6-6 6',
  ban: 'M3 12a9 9 0 1 0 18 0a9 9 0 1 0-18 0M5.6 5.6l12.8 12.8',
  'chevron-left': 'm15 6-6 6 6 6',
  'chevron-right': 'm9 6 6 6-6 6',
  check: 'M5 12l5 5L20 7',
  close: 'M6 6l12 12M18 6 6 18',
  copy: 'M8 8h12v12H8zM4 16V4h12',
  document: 'M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h5',
  compass: 'M3 12a9 9 0 1 0 18 0a9 9 0 1 0-18 0M15 9l-2 5-4 1 2-5z',
  download: 'M12 4v11M7 10l5 5 5-5M5 20h14',
  heart: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z',
  help: 'M3 12a9 9 0 1 0 18 0a9 9 0 1 0-18 0M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.7M12 17v.5',
  info: 'M3 12a9 9 0 1 0 18 0a9 9 0 1 0-18 0M12 11v6M12 7v.5',
  key: 'M4 15a4 4 0 1 0 8 0a4 4 0 1 0-8 0M11 12l9-9M17 6l3 3',
  lock: 'M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4',
  'lock-open': 'M5 11h14v10H5zM8 11V7a4 4 0 0 1 7.5-2',
  mail: 'M3 5h18v14H3zM3 6l9 7 9-7',
  menu: 'M4 7h16M4 12h16M4 17h16',
  mic: 'M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM6 11a6 6 0 0 0 12 0M12 17v4M8 21h8',
  moon: 'M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4',
  rss: 'M5 5a14 14 0 0 1 14 14M5 11a8 8 0 0 1 8 8M6 18.5v.5',
  refresh: 'M20 12a8 8 0 1 1-2.3-5.6M20 4v5h-5',
  share: 'M12 3v13M7 8l5-5 5 5M5 14v7h14v-7',
  'sign-out': 'M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11',
  swap: 'M4 9h13l-3-3M20 15H7l3 3',
  sliders: 'M4 7h10M18 7h2M4 17h4M12 17h8M14 5v4M8 15v4',
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
