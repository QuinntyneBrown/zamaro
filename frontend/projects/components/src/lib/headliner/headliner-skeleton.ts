import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Skeleton } from '../skeleton/skeleton';

/**
 * The headliner while the lineup loads (docs/design-system/components/headliner, "Loading"): the
 * poster frame holding skeletons sized like the art, kicker, name and lines. A hidden `<div>`, not an
 * article; the lineup's status line speaks for it.
 */
@Component({
  selector: 'zm-headliner-skeleton',
  imports: [Skeleton],
  host: { 'aria-hidden': 'true' },
  template: `<div class="headliner">
    <zm-skeleton shape="portrait" />
    <div class="headliner__body">
      <zm-skeleton width="short" />
      <zm-skeleton shape="poster" />
      <zm-skeleton />
      <zm-skeleton width="long" />
    </div>
  </div>`,
  styleUrl: './headliner.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeadlinerSkeleton {}
