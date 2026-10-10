import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Chip, FilterGroup } from 'components';

/** The lineup's style filters (docs/mocks/pages/discover/default.html). */
@Component({
  selector: 'zm-filter-group-scenario',
  imports: [Chip, FilterGroup],
  template: `<zm-filter-group legend="Filter by style">
    @for (style of styles; track style) {
      <zm-chip [pressed]="style === 'Gospel choir'">{{ style }}</zm-chip>
    }
  </zm-filter-group>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class FilterGroupScenario {
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
