import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AvatarButton } from 'components';

/** Naomi Fraser's account button in the top bar (docs/mocks/pages/discover/default.html). */
@Component({
  selector: 'zm-avatar-button-scenario',
  imports: [AvatarButton],
  template: `<header class="topbar">
    <zm-avatar-button
      name="Naomi Fraser"
      label="Account menu for Naomi Fraser"
      controls="account-menu"
    />
  </header>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AvatarButtonScenario {}
