import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HeadlinerSkeleton } from 'components';

/** The headliner's frame while the lineup loads (docs/mocks/pages/discover/loading.html). */
@Component({
  selector: 'zm-headliner-skeleton-scenario',
  imports: [HeadlinerSkeleton],
  template: `<zm-headliner-skeleton />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class HeadlinerSkeletonScenario {}
