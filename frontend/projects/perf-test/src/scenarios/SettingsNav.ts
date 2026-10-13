import { ChangeDetectionStrategy, Component } from '@angular/core';
import { type SettingsSection, SettingsNav } from 'components';

/** Naomi's account settings nav (sidebar-navigation CRD): nine sections, Profile current. */
@Component({
  selector: 'zm-settings-nav-scenario',
  imports: [SettingsNav],
  template: `<zm-settings-nav label="Settings sections" [sections]="sections" current="profile" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SettingsNavScenario {
  protected readonly sections: SettingsSection[] = [
    { id: 'profile', label: 'Profile' },
    { id: 'church', label: 'Church' },
    { id: 'email', label: 'Email' },
    { id: 'password', label: 'Password' },
    { id: 'preferences', label: 'Email preferences' },
    { id: 'two-step', label: 'Two-step sign-in' },
    { id: 'devices', label: 'Signed-in devices' },
    { id: 'data', label: 'Your data' },
    { id: 'delete', label: 'Delete account' },
  ];
}
