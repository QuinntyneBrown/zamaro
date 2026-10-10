import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Artwork } from 'components';

/** The headliner's yellow artwork with its tag. */
@Component({
  selector: 'zm-artwork-scenario',
  imports: [Artwork],
  template: `<zm-artwork
    [yellow]="true"
    tag="Headliner"
    label="Abigail Mensah singing at a microphone"
  />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ArtworkScenario {}
