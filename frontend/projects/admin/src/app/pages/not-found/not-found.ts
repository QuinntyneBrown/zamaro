import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { ButtonAnchor, ErrorPage, Icon } from 'components';
import { PageTitle } from '../../shared/page-title';

const CONTACT_EMAIL = 'hello@zamaro.ca';

/**
 * An admin address that is no screen, reached inside the application (docs/mocks/pages/not-found):
 * the same "No show" as the public site, with a way back to Discover. A direct request for such an
 * address is answered by the web server with the public 404 page (ADR-0023).
 */
@Component({
  selector: 'zm-not-found-page',
  imports: [ButtonAnchor, ErrorPage, Icon, TranslocoPipe],
  template: `<zm-error-page
    [overline]="'errors.notFound.overline' | transloco"
    [poster]="'errors.notFound.poster' | transloco"
    [posterSuffix]="'errors.notFound.suffix' | transloco"
    [lead]="'errors.notFound.lead' | transloco"
  >
    <zm-button-anchor slot="actions" variant="primary" size="lg" href="/"
      >{{ 'errors.notFound.findWhosFree' | transloco }} <zm-icon name="arrow-right"
    /></zm-button-anchor>
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
    inject(PageTitle).set('errors.notFound.pageTitle');
  }
}
