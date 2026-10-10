import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Icon } from 'components';

/** The brand mark's microphone, as the top bar renders it. */
@Component({
  selector: 'zm-icon-scenario',
  imports: [Icon],
  template: `<zm-icon name="mic" size="sm" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class IconScenario {}
