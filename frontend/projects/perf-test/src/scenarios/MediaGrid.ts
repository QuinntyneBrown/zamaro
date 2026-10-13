import { ChangeDetectionStrategy, Component } from '@angular/core';
import { VideoCard, ZM_HLS_LOADER } from 'components';

const VIDEOS = [
  ['Way Maker — live at Bethel Pentecostal, Hamilton', '6:12', '6 minutes 12 seconds'],
  ['Great Is Thy Faithfulness — acoustic', '4:40', '4 minutes 40 seconds'],
  ['Twi praise medley — Harvest Sunday 2025', '8:05', '8 minutes 5 seconds'],
  ['Goodness of God — women’s retreat, Muskoka', '5:30', '5 minutes 30 seconds'],
].map(([caption, duration, spoken]) => ({
  caption,
  stamp: `Play · ${duration}`,
  label: `Play ${caption.replace(' — ', ', ')}, ${spoken}`,
}));

/** The profile's "Watch her lead" grid: four idle videos, the first one featured. */
@Component({
  selector: 'zm-media-grid-scenario',
  imports: [VideoCard],
  providers: [{ provide: ZM_HLS_LOADER, useValue: () => Promise.reject(new Error('No network')) }],
  template: `<ul class="media-grid" role="list">
    @for (video of videos; track video.caption; let i = $index) {
      <li>
        <zm-video-card
          [caption]="video.caption"
          [stampText]="video.stamp"
          [label]="video.label"
          [artVariant]="i === 0 ? 'group' : 'solo'"
          [artTilt]="i === 2"
          [artYellow]="i === 3"
          [artLabel]="video.caption"
          stream="/media/samples/video/stream.m3u8"
          errorText="This video didn’t load. Press play to try again."
        />
      </li>
    }
  </ul>`,
  styles: `
    .media-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: var(--space-6);
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
  protected readonly videos = VIDEOS;
}
