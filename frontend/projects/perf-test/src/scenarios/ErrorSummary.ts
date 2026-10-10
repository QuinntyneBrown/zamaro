import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ErrorSummary } from 'components';

/** Account settings after a failed save (form-layout CRD): two problems, one link each. */
@Component({
  selector: 'zm-error-summary-scenario',
  imports: [ErrorSummary],
  template: `<zm-error-summary
    summaryId="error-summary"
    heading="Fix 2 things before saving"
    [autoFocus]="false"
    [items]="items"
  />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ErrorSummaryScenario {
  protected readonly items = [
    { fieldId: 'new-email', message: 'Enter a full new email address' },
    { fieldId: 'postal', message: 'Enter a full postal code' },
  ];
}
