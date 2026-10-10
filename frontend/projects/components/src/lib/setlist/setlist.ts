import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export interface SetlistEntry {
  title: string;
  /** The writer or source: "Sinach". */
  credit: string | null;
  /** As the artist leads it: "Key of B♭". */
  key: string;
}

/**
 * Numbered songs (docs/design-system/components/setlist): a two-digit counter, the title in the
 * condensed display face with its credit beneath, and the key as stub text. Two columns from MD.
 */
@Component({
  selector: 'zm-setlist',
  template: `<ol class="setlist" role="list">
    @for (song of songs(); track $index) {
      <li>
        <span class="setlist__song"
          >{{ song.title }}
          @if (song.credit) {
            <span class="setlist__credit">{{ song.credit }}</span>
          }
        </span>
        <span class="setlist__key">{{ song.key }}</span>
      </li>
    }
  </ol>`,
  styles: `
    .setlist {
      display: grid;
      gap: 0;
      margin: 0;
      padding: 0;
      list-style: none;
      counter-reset: song;
    }

    .setlist > li {
      counter-increment: song;
      display: grid;
      grid-template-columns: 3rem minmax(0, 1fr) auto;
      align-items: baseline;
      gap: var(--space-3);
      padding-block: var(--space-4);
      border-bottom: var(--border-width-hairline) solid var(--color-border-default);
    }

    .setlist > li::before {
      content: counter(song, decimal-leading-zero);
      font: var(--text-figure);
      color: var(--color-fg-muted);
    }

    .setlist__song {
      font: var(--text-h4);
      line-height: 1.1;
      text-transform: uppercase;
    }

    .setlist__credit {
      display: block;
      font: var(--text-body-sm);
      color: var(--color-fg-muted);
      text-transform: none;
    }

    .setlist__key {
      font: var(--text-stub);
      text-transform: uppercase;
      white-space: nowrap;
    }

    @media (min-width: 48rem) {
      .setlist {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        column-gap: var(--space-8);
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Setlist {
  readonly songs = input.required<readonly SetlistEntry[]>();
}
