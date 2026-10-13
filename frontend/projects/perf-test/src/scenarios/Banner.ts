import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Banner } from 'components';

/**
 * Naomi's "Verify your email" banner with its "Resend email" button
 * (docs/mocks/notifications/system-banner/persistent).
 */
@Component({
  selector: 'zm-banner-scenario',
  imports: [Banner],
  template: `<zm-banner
    variant="warning"
    persistent
    label="Verify your email"
    actionLabel="Resend email"
    >We sent a link to naomi.fraser&#64;riversidecc.ca. You need it to send requests.</zm-banner
  >`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class BannerScenario {}
