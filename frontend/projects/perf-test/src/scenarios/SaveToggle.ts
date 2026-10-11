import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SAVE_TOGGLE_TEXT, SaveToggle } from 'components';

/** Luz Viva's heart, saved (save-toggle CRD), with the names from a static text provider. */
@Component({
  selector: 'zm-save-toggle-scenario',
  imports: [SaveToggle],
  providers: [
    {
      provide: SAVE_TOGGLE_TEXT,
      useValue: {
        save: (name: string) => `Save ${name} to your saved artists`,
        remove: (name: string) => `Remove ${name} from your saved artists`,
        and: 'and',
      },
    },
  ],
  template: `<zm-save-toggle artistName="Luz Viva" [saved]="true" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SaveToggleScenario {}
