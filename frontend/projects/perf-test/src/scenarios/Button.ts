import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Button, Icon } from 'components';

/** The top bar's theme toggle: a ghost icon button with a pressed state. */
@Component({
  selector: 'zm-button-scenario',
  imports: [Button, Icon],
  template: `<zm-button variant="ghost" iconOnly [pressed]="false"
    ><zm-icon name="moon" /><span class="visually-hidden">Dark theme</span></zm-button
  >`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ButtonScenario {}
