import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Setlist, type SetlistEntry } from 'components';

/** Abigail's full setlist, the profile's repeated composition (docs/mocks/pages/artist). */
@Component({
  selector: 'zm-setlist-scenario',
  imports: [Setlist],
  template: `<zm-setlist [songs]="songs" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SetlistScenario {
  protected readonly songs: SetlistEntry[] = [
    { title: 'Way Maker', credit: 'Sinach', key: 'Key of E' },
    { title: 'Goodness of God', credit: 'Bethel Music', key: 'Key of A' },
    { title: 'Great Is Thy Faithfulness', credit: 'Thomas Chisholm, 1923', key: 'Key of D' },
    { title: 'Jireh', credit: 'Elevation & Maverick City', key: 'Key of B♭' },
    { title: 'Blessed Assurance', credit: 'Fanny Crosby', key: 'Key of D' },
    { title: 'Build My Life', credit: 'Pat Barrett', key: 'Key of G' },
    { title: 'Oceans (Where Feet May Fail)', credit: 'Hillsong United', key: 'Key of D' },
    { title: 'Twi praise medley', credit: 'Traditional Ghanaian', key: 'Key of F' },
  ];
}
