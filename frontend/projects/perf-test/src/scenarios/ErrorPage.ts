import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  Button,
  ButtonAnchor,
  ButtonLink,
  type DescriptionItem,
  DescriptionList,
  ErrorPage,
  Icon,
} from 'components';

/**
 * The 500 page (docs/mocks/pages/server-error): "Dead air", the reference and time, Try again, Back
 * to Discover and the note, so every slot renders.
 */
@Component({
  selector: 'zm-error-page-scenario',
  imports: [Button, ButtonAnchor, ButtonLink, DescriptionList, ErrorPage, Icon],
  template: `<zm-error-page
    overline="Error 500 · Something broke on our side"
    poster="Dead air"
    posterSuffix=": something went wrong"
    lead="Something went wrong on our side, not yours. Anything you already sent is safe."
  >
    <zm-description-list slot="details" [items]="receipt" />
    <zm-button slot="actions" variant="primary" size="lg"
      ><zm-icon name="refresh" />Try again</zm-button
    >
    <zm-button-link slot="actions" size="lg" link="/">Back to Discover</zm-button-link>
    <span slot="note"
      >Still broken?
      <a href="mailto:hello@zamaro.ca?subject=7f3c9a2e-41d6-4b8e-9c05-2a6e1d8b4f17"
        >Email us the reference</a
      >
      and we’ll look it up.</span
    >
  </zm-error-page>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ErrorPageScenario {
  protected readonly receipt: DescriptionItem[] = [
    { id: 'reference', term: 'Reference', value: '7f3c9a2e-41d6-4b8e-9c05-2a6e1d8b4f17' },
    { id: 'when', term: 'When', value: 'Fri 9 Oct, 10:42 a.m.' },
  ];
}
