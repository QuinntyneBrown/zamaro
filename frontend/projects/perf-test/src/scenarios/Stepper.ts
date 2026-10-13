import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Stepper, type StepperStep } from 'components';

/** The application's four steps on "Price and travel" (docs/mocks/pages/apply/step-3.html): two done, one current. */
@Component({
  selector: 'zm-stepper-scenario',
  imports: [Stepper],
  template: `<zm-stepper
    label="Application steps"
    doneSuffix=", done"
    invalidSuffix=", needs fixing"
    [steps]="steps"
  />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class StepperScenario {
  protected readonly steps: StepperStep[] = [
    { title: 'About you', done: true, link: '/artists/apply' },
    { title: 'Your music', done: true, link: '/artists/apply/music' },
    { title: 'Price and travel', current: true },
    { title: 'References and review' },
  ];
}
