import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { ButtonLink, EmptyState, Icon } from 'components';
import { PageTitle } from '../../shared/page-title';

/**
 * The applications queue (docs/mocks/pages/admin-applications). Until applications exist (M3 S11–S13)
 * the queue shows its empty state: "No applications waiting".
 */
@Component({
  selector: 'zm-applications-page',
  imports: [ButtonLink, EmptyState, Icon, TranslocoPipe],
  template: `<div class="container">
    <header class="page-head">
      <div>
        <p class="overline">{{ 'admin.applications.overline' | transloco }}</p>
        <h1 class="page-head__title">{{ 'admin.applications.title' | transloco }}</h1>
        <p class="page-head__sub">{{ 'admin.applications.nothingWaiting' | transloco }}</p>
      </div>
    </header>
    <div class="page-body">
      <zm-empty-state
        [stamp]="'admin.applications.empty.stamp' | transloco"
        [heading]="'admin.applications.empty.title' | transloco"
      >
        {{ 'admin.applications.empty.body' | transloco }}
        <zm-button-link slot="actions" variant="primary" link="/artists"
          ><zm-icon name="mic" />{{
            'admin.applications.empty.openArtists' | transloco
          }}</zm-button-link
        >
      </zm-empty-state>
    </div>
  </div>`,
  styleUrl: '../../shared/page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplicationsPage {
  constructor() {
    inject(PageTitle).set('admin.applications.title');
  }
}
