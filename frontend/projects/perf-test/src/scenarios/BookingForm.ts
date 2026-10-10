import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BookingForm, FormField } from 'components';

/** The Discover search bar with its four fields. */
@Component({
  selector: 'zm-booking-form-scenario',
  imports: [BookingForm, FormField],
  template: `<form aria-labelledby="find-title">
    <zm-booking-form heading="Your event" stamp="Admit one church" titleId="find-title">
      <zm-form-field fieldId="d" type="date" label="Event date" />
      <zm-form-field fieldId="k" type="select" label="Kind of gathering" [options]="kinds" />
      <zm-form-field fieldId="p" label="Church location" />
      <zm-form-field fieldId="r" type="select" label="How far can they drive?" [options]="radii" />
    </zm-booking-form>
  </form>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class BookingFormScenario {
  protected readonly kinds = [
    { value: 'sunday-service', label: 'Sunday service' },
    { value: 'worship-night', label: 'Worship night' },
    { value: 'youth-event', label: 'Youth event' },
  ];
  protected readonly radii = [
    { value: '40', label: '40 km · 30 min' },
    { value: '120', label: '120 km · 1.5 hr' },
  ];
}
