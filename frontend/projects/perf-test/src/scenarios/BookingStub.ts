import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BookingForm, Button, FormField, InlineMessage } from 'components';

/** Abigail Mensah's booking stub for Sat 14 Nov, with the submit M5 turns on. */
@Component({
  selector: 'zm-booking-stub-scenario',
  imports: [BookingForm, Button, FormField, InlineMessage],
  template: `<form aria-labelledby="book-title">
    <zm-booking-form
      variant="stub"
      heading="Book Abigail"
      headingId="book-title"
      stamp="No. ACT-0027"
      price="From $650"
      priceNote="per service · travel included"
    >
      <zm-form-field fieldId="book-date" type="date" label="Event date" messageId="date-help">
        <zm-inline-message slot="message" id="date-help" variant="success" live
          >Abigail is free Sat 14 Nov</zm-inline-message
        >
      </zm-form-field>
      <zm-form-field
        fieldId="book-kind"
        type="select"
        label="Kind of gathering"
        [options]="kinds"
      />
      <zm-form-field fieldId="book-church" label="Church" />
      <zm-form-field
        fieldId="book-message"
        type="textarea"
        label="Message"
        optionalMarker="(optional)"
        placeholder="Your church, the room, the songs you love."
      />
      <zm-button variant="primary" size="lg" block type="submit"
        >Request to book · Sat 14 Nov</zm-button
      >
      <span slot="fine"
        >Nothing is charged until Abigail accepts.
        <a href="#how">Cancel free up to 14 days before</a>.</span
      >
    </zm-booking-form>
  </form>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class BookingStubScenario {
  protected readonly kinds = [
    { value: 'sunday-service', label: 'Sunday service' },
    { value: 'worship-night', label: 'Worship night' },
    { value: 'youth-event', label: 'Youth event' },
  ];
}
