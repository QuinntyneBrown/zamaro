import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ButtonLink, Icon } from 'components';

/** The headliner's profile link. */
@Component({
  selector: 'zm-button-link-scenario',
  imports: [ButtonLink, Icon],
  template: `<zm-button-link
    variant="ink"
    link="/artists/abigail-mensah"
    [queryParams]="{ date: '2026-11-14' }"
    >See Abigail’s profile <zm-icon name="arrow-right"
  /></zm-button-link>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ButtonLinkScenario {}
