import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SkipLink } from 'components';

@Component({
  selector: 'zm-skip-link-scenario',
  imports: [SkipLink],
  template: `<zm-skip-link>Skip to content</zm-skip-link>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SkipLinkScenario {}
