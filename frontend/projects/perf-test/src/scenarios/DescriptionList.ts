import { ChangeDetectionStrategy, Component } from '@angular/core';
import { type DescriptionItem, DescriptionList } from 'components';

/** The cancellation policy on Discover: three rows in two columns. */
@Component({
  selector: 'zm-description-list-scenario',
  imports: [DescriptionList],
  template: `<zm-description-list [items]="policy" [columns]="2" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DescriptionListScenario {
  protected readonly policy: DescriptionItem[] = [
    {
      id: 'early',
      term: '14 days or more before',
      value: 'Cancel free. Your deposit comes back in full.',
    },
    {
      id: 'late',
      term: 'Fewer than 14 days before',
      value: 'Your deposit isn’t refunded. The balance is never charged.',
    },
    { id: 'artist', term: 'If the artist cancels', value: 'Everything you paid comes back.' },
  ];
}
