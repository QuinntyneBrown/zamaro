import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BookingForm, Button, FormField } from 'components';

/** The sign-in card (docs/mocks/pages/sign-in/default.html): Naomi's "Admit one · Your account". */
@Component({
  selector: 'zm-auth-card-scenario',
  imports: [BookingForm, Button, FormField],
  template: `<form aria-labelledby="card-title">
    <zm-booking-form
      variant="auth"
      heading="Sign in"
      headingId="card-title"
      [headingLevel]="1"
      stamp="Admit one · Your account"
    >
      <p>Welcome back. Your saved artists and requests are waiting.</p>
      <zm-form-field
        fieldId="email"
        type="email"
        label="Email"
        requiredMarker="(required)"
        autocomplete="email"
        placeholder="name@church.ca"
      />
      <zm-form-field
        fieldId="password"
        type="password"
        label="Password"
        requiredMarker="(required)"
        autocomplete="current-password"
      />
      <zm-button variant="primary" size="lg" block type="submit">Sign in</zm-button>
      <a slot="links" href="#forgot">Forgot your password?</a>
      <a slot="links" href="#sign-up">Create an account</a>
      <span slot="fine">Artists sign in here too.</span>
    </zm-booking-form>
  </form>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AuthCardScenario {}
