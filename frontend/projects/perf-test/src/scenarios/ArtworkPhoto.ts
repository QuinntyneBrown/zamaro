import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Artwork, type ArtworkPhoto } from 'components';

/** An inline image, so the run needs no network. */
const PHOTO: ArtworkPhoto = {
  src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600'%3E%3Crect width='800' height='600' fill='%23888'/%3E%3Ccircle cx='400' cy='260' r='140'/%3E%3C/svg%3E",
  width: 800,
  height: 600,
  sizes: '(min-width: 48rem) 25vw, 50vw',
};

/** A gallery square with Abigail's first photo, decorative inside its "Open photo" link. */
@Component({
  selector: 'zm-artwork-photo-scenario',
  imports: [Artwork],
  template: `<zm-artwork ratio="square" [photo]="photo" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ArtworkPhotoScenario {
  protected readonly photo = PHOTO;
}
