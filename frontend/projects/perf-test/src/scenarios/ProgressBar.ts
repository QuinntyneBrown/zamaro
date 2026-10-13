import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ProgressBar } from 'components';

/** Abigail's video upload (docs/mocks/dialogs/add-video/busy.html): 46 % of jireh-living-waters.mp4. */
@Component({
  selector: 'zm-progress-bar-scenario',
  imports: [ProgressBar],
  template: `<zm-progress-bar
    label="Uploading jireh-living-waters.mp4"
    valueText="46%"
    ariaValueText="46%, about 2 minutes left"
    [value]="46"
  />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ProgressBarScenario {}
