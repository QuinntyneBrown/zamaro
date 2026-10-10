import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Chip } from 'components';

/** A pressed quick-pick city. */
@Component({
  selector: 'zm-chip-scenario',
  imports: [Chip],
  template: `<zm-chip size="sm" [pressed]="true">Burlington</zm-chip>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ChipScenario {}
