import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { AuthService } from 'api';
import { ButtonLink, EmptyState, Icon } from 'components';
import { PageMeta } from '../../shared/page-meta';

/**
 * The artist workspace under `/artist` (docs/mocks/pages/dashboard): an artist gets the routed
 * screen. Anyone else signed in gets "This page is for artists" in the church's own header, in place
 * of a redirect, with a way back to Discover (L2-074); the API answers them 404. A guest never gets
 * here: the route's guard sends them to sign in first.
 */
@Component({
  selector: 'zm-workspace',
  imports: [ButtonLink, EmptyState, Icon, RouterLink, RouterOutlet, TranslocoPipe],
  template: `@if (isArtist()) {
      <router-outlet />
    } @else {
      <div class="container workspace-forbidden">
        <zm-empty-state
          [headingLevel]="1"
          [stamp]="'workspace.forbidden.stamp' | transloco"
          [heading]="'workspace.forbidden.title' | transloco"
        >
          <p>
            {{
              (church() ? 'workspace.forbidden.text' : 'workspace.forbidden.textNoChurch')
                | transloco: { name: name(), church: church() }
            }}
          </p>
          <zm-button-link slot="actions" variant="primary" link="/"
            ><zm-icon name="arrow-left" />{{
              'workspace.forbidden.action' | transloco
            }}</zm-button-link
          >
          <a slot="actions" routerLink="/" fragment="join">{{
            'workspace.forbidden.apply' | transloco
          }}</a>
        </zm-empty-state>
      </div>
    }`,
  styles: `
    .workspace-forbidden {
      padding-block: var(--space-16);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Workspace {
  private readonly user = inject(AuthService).currentUser;
  protected readonly isArtist = computed(() => this.user()?.roles.includes('artist') ?? false);
  protected readonly name = computed(() => this.user()?.name ?? '');
  protected readonly church = computed(() => this.user()?.church?.name ?? '');

  constructor() {
    inject(PageMeta).set({
      title: inject(TranslocoService).translate('workspace.forbidden.pageTitle'),
      index: false,
    });
  }
}
