import { ChangeDetectionStrategy, Component } from '@angular/core';
import { type StepItem, Steps } from 'components';

/** "How booking works" on Discover: three steps. */
@Component({
  selector: 'zm-steps-scenario',
  imports: [Steps],
  template: `<zm-steps [items]="steps" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class StepsScenario {
  protected readonly steps: StepItem[] = [
    {
      title: 'Pick your date',
      description: 'You only see artists who are free that day and will drive to you.',
    },
    {
      title: 'Send a request',
      description: 'Tell them about your church and the songs you love. Nothing is charged yet.',
    },
    {
      title: 'Lock it in',
      description: 'When they accept, pay a 25% deposit. The rest is due after the event.',
    },
  ];
}
