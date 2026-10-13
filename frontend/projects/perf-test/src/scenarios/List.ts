import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Badge, Button, List, type ListItem, ListTrail } from 'components';

/** Naomi's three signed-in devices (list CRD): "This device", then two End session buttons. */
@Component({
  selector: 'zm-list-scenario',
  imports: [Badge, Button, List, ListTrail],
  template: `<zm-list variant="device" [items]="devices">
    <ng-template zmListTrail let-item>
      @if (item.id === 'chrome') {
        <zm-badge>This device</zm-badge>
      } @else {
        <zm-button size="sm" [label]="'End session on ' + item.title">End session</zm-button>
      }
    </ng-template>
  </zm-list>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ListScenario {
  protected readonly devices: ListItem[] = [
    { id: 'chrome', title: 'Chrome on Windows', meta: 'Burlington, ON · This device · active now' },
    { id: 'safari', title: 'Safari on iPhone', meta: 'Burlington, ON · Last active 2 hours ago' },
    { id: 'firefox', title: 'Firefox on Mac', meta: 'Hamilton, ON · Last active Tue 6 Oct' },
  ];
}
