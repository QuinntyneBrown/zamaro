import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Button, EmptyState } from 'components';

/** The Christmas Eve sold-out state (docs/mocks/pages/discover/empty.html). */
@Component({
  selector: 'zm-empty-state-scenario',
  imports: [Button, EmptyState],
  template: `<zm-empty-state stamp="Sold out" heading="Nobody’s free Christmas Eve within 40 km">
    <p>
      Every gospel choir near Burlington is booked for Christmas Eve. Try a nearby date, or widen
      the radius: 2 choirs are free within 120 km.
    </p>
    <zm-button slot="actions" variant="primary">Search within 120 km · 2 free</zm-button>
    <zm-button slot="actions">Show all styles</zm-button>
  </zm-empty-state>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class EmptyStateScenario {}
