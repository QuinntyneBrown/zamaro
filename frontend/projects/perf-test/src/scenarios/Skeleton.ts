import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Skeleton } from 'components';

/** One loading ticket's placeholders (docs/mocks/pages/discover/loading.html). */
@Component({
  selector: 'zm-skeleton-scenario',
  imports: [Skeleton],
  template: `<div aria-hidden="true">
    <zm-skeleton shape="block" />
    <zm-skeleton width="short" />
    <zm-skeleton shape="title" />
    <zm-skeleton />
    <zm-skeleton shape="title" width="short" />
    <zm-skeleton shape="target" />
  </div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SkeletonScenario {}
