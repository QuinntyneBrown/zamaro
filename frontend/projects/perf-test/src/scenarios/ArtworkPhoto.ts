import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Artwork, type ArtworkPhoto } from 'components';

/** A 4 × 3 grey pixel grid, inline so the run needs no network. */
const PHOTO: ArtworkPhoto = {
  src:
    'data:image/svg+xml,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="#8a7a6a"/><circle cx="400" cy="200" r="150" fill="#d8c8b0"/></svg>',
    ),
  width: 800,
  height: 600,
};

/** A gallery square printing Abigail's first photo. */
@Component({
  selector: 'zm-artwork-photo-scenario',
  imports: [Artwork],
  template: `<zm-artwork
    ratio="square"
    label="Abigail at the microphone during a Sunday service"
    [photo]="photo"
  />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ArtworkPhotoScenario {
  protected readonly photo = PHOTO;
}
