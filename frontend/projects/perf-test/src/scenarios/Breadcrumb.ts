import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Breadcrumb, type Crumb } from 'components';

/** The profile's back link to Naomi's search (docs/mocks/pages/artist/default.html). */
@Component({
  selector: 'zm-breadcrumb-scenario',
  imports: [Breadcrumb],
  template: `<zm-breadcrumb [crumbs]="crumbs" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class BreadcrumbScenario {
  protected readonly crumbs: Crumb[] = [
    {
      label: 'Discover · Sat 14 Nov',
      link: '/',
      queryParams: { date: '2026-11-14', kind: 'worship-night', place: 'Burlington' },
    },
    { label: 'Abigail Mensah' },
  ];
}
