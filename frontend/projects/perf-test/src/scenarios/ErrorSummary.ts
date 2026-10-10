import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ErrorSummary } from 'components';

/** The Discover form's error summary with two problems (docs/mocks/pages/discover/invalid.html). */
@Component({
  selector: 'zm-error-summary-scenario',
  imports: [ErrorSummary],
  template: `<zm-error-summary
    summaryId="error-summary"
    heading="Two things before we can search"
    [headingLevel]="3"
    [autoFocus]="false"
    [items]="items"
  />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ErrorSummaryScenario {
  protected readonly items = [
    { fieldId: 'find-date', message: 'Pick your event date.' },
    { fieldId: 'find-place', message: 'Enter your church’s location.' },
  ];
}
