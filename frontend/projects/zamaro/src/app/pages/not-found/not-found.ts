import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { ButtonLink, ErrorPage, Icon } from 'components';
import { HttpStatus } from '../../shared/http-status';

const CONTACT_EMAIL = 'hello@zamaro.ca';

/**
 * Any address that is no page (docs/mocks/pages/not-found/default): "No show", served with a real
 * 404 (L2-112), and a way back to Discover. "Your saved artists" joins the actions with the saved
 * list (M2).
 */
@Component({
  selector: 'zm-not-found-page',
  imports: [ButtonLink, ErrorPage, Icon, TranslocoPipe],
  template: `<zm-error-page
    [overline]="'errors.notFound.overline' | transloco"
    [poster]="'errors.notFound.poster' | transloco"
    [posterSuffix]="'errors.notFound.suffix' | transloco"
    [lead]="'errors.notFound.lead' | transloco"
  >
    <zm-button-link slot="actions" variant="primary" size="lg" link="/"
      >{{ 'errors.notFound.findWhosFree' | transloco }} <zm-icon name="arrow-right"
    /></zm-button-link>
    <span slot="note"
      >{{ 'errors.notFound.noteBefore' | transloco }}
      <a [href]="contactHref">{{ 'errors.notFound.noteLink' | transloco }}</a>
      {{ 'errors.notFound.noteAfter' | transloco }}</span
    >
  </zm-error-page>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundPage {
  protected readonly contactHref = `mailto:${CONTACT_EMAIL}`;

  constructor() {
    inject(HttpStatus).set(404);
  }
}
