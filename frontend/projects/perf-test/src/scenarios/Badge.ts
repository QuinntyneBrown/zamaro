import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Badge } from 'components';

/** The headliner's availability stamp. */
@Component({
  selector: 'zm-badge-scenario',
  imports: [Badge],
  template: `<zm-badge variant="free">Free Sat 14 Nov</zm-badge>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class BadgeScenario {}
