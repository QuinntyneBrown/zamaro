import { ChangeDetectionStrategy, Component } from '@angular/core';
import { VideoCard, ZM_HLS_LOADER } from 'components';

interface Clip {
  caption: string;
  stamp: string;
  label: string;
  art: string;
  group?: boolean;
  tilt?: boolean;
  yellow?: boolean;
}

/** The profile's four videos in "Watch her lead", the first featured (docs/mocks/pages/artist). */
@Component({
  selector: 'zm-media-grid-scenario',
  imports: [VideoCard],
  providers: [{ provide: ZM_HLS_LOADER, useValue: () => Promise.reject(new Error('No network')) }],
  template: `<ul class="media-grid" role="list">
    @for (clip of clips; track clip.caption) {
      <li>
        <zm-video-card
          [caption]="clip.caption"
          [stampText]="clip.stamp"
          [label]="clip.label"
          [artVariant]="clip.group ? 'group' : 'solo'"
          [artTilt]="!!clip.tilt"
          [artYellow]="!!clip.yellow"
          [artLabel]="clip.art"
          stream="https://media.zamaro.test/videos/sample.m3u8"
          errorText="This video didn’t load. Press play to try again."
        />
      </li>
    }
  </ul>`,
  styles: `
    .media-grid {
      display: grid;
      gap: var(--space-6);
      grid-template-columns: repeat(3, minmax(0, 1fr));
      list-style: none;
      padding: 0;
    }

    .media-grid > :first-child {
      grid-column: 1 / -1;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class MediaGridScenario {
  protected readonly clips: Clip[] = [
    {
      caption: 'Way Maker — live at Bethel Pentecostal, Hamilton',
      stamp: 'Play · 6:12',
      label: 'Play Way Maker, live at Bethel Pentecostal, Hamilton, 6 minutes 12 seconds',
      art: 'Abigail leading a full sanctuary, hands raised in the front rows',
      group: true,
    },
    {
      caption: 'Great Is Thy Faithfulness — acoustic',
      stamp: 'Play · 4:40',
      label: 'Play Great Is Thy Faithfulness, acoustic, 4 minutes 40 seconds',
      art: 'Abigail with an acoustic guitarist in a small chapel',
    },
    {
      caption: 'Twi praise medley — Harvest Sunday 2025',
      stamp: 'Play · 8:05',
      label: 'Play Twi praise medley, Harvest Sunday 2025, 8 minutes 5 seconds',
      art: 'A congregation dancing during a Ghanaian praise medley',
      tilt: true,
    },
    {
      caption: 'Goodness of God — women’s retreat, Muskoka',
      stamp: 'Play · 5:30',
      label: 'Play Goodness of God, women’s retreat, Muskoka, 5 minutes 30 seconds',
      art: 'Abigail singing at a lakeside women’s retreat',
      yellow: true,
    },
  ];
}
