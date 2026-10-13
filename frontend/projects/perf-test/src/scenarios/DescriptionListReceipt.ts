import { ChangeDetectionStrategy, Component } from '@angular/core';
import { type DescriptionItem, DescriptionList } from 'components';

/** The application receipt (docs/mocks/pages/apply/success.html): four rows and the fine print. */
@Component({
  selector: 'zm-description-list-receipt-scenario',
  imports: [DescriptionList],
  template: `<zm-description-list
    variant="receipt"
    label="Application A-0219"
    fine="3 business days. Monday 12 Oct is Thanksgiving."
    [items]="items"
  />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DescriptionListReceiptScenario {
  protected readonly items: DescriptionItem[] = [
    { id: 'number', term: 'Application', value: 'A-0219' },
    { id: 'status', term: 'Status', value: 'Submitted' },
    { id: 'sent', term: 'Sent', value: 'Fri 9 Oct, 10:42 a.m.' },
    { id: 'reply', term: 'Reply by', value: 'Thu 15 Oct' },
  ];
}
