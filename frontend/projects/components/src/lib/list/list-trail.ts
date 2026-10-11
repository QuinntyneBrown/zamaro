import { Directive, inject, TemplateRef } from '@angular/core';
import type { ListItem } from './list';

/** The trail of each list item: `<ng-template zmListTrail let-item>` (docs/specs/components/list). */
@Directive({ selector: 'ng-template[zmListTrail]' })
export class ListTrail {
  readonly template = inject<TemplateRef<{ $implicit: ListItem }>>(TemplateRef);
}
