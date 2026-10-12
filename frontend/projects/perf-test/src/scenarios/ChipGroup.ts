import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Chip, ChipGroup } from 'components';

/** The lineup's style filters (docs/mocks/pages/discover/default.html). */
@Component({
  selector: 'zm-chip-group-scenario',
  imports: [Chip, ChipGroup],
  template: `<zm-chip-group legend="Filter by style">
    @for (style of styles; track style) {
      <zm-chip [pressed]="style === 'Gospel choir'">{{ style }}</zm-chip>
    }
  </zm-chip-group>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ChipGroupScenario {
  protected readonly styles = [
    'Band',
    'Solo vocalist',
    'Gospel choir',
    'Acoustic',
    'Hymns',
    'Spanish',
    'Under $800',
  ];
}
