import { ChangeDetectionStrategy, Component } from '@angular/core';
import { VideoCard, ZM_HLS_LOADER } from 'components';

/** Abigail's first video, idle: the wide group art, the stamp and the caption. */
@Component({
  selector: 'zm-video-card-scenario',
  imports: [VideoCard],
  providers: [{ provide: ZM_HLS_LOADER, useValue: () => Promise.reject(new Error('No network')) }],
  template: `<zm-video-card
    caption="Way Maker — live at Bethel Pentecostal, Hamilton"
    stampText="Play · 6:12"
    label="Play Way Maker, live at Bethel Pentecostal, Hamilton, 6 minutes 12 seconds"
    artVariant="group"
    artLabel="Abigail leading a full sanctuary, hands raised in the front rows"
    stream="/media/samples/video/stream.m3u8"
    errorText="This video didn’t load. Press play to try again."
  />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class VideoCardScenario {}
