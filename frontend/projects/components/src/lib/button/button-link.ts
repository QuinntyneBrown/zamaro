import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { type ButtonSize, type ButtonVariant, buttonClasses } from './button';

/** A route link styled as a button, e.g. the headliner's "See Abigail’s profile". */
@Component({
  selector: 'zm-button-link',
  imports: [RouterLink],
  template: `<a [class]="classes()" [routerLink]="link()" [queryParams]="queryParams()"
    ><ng-content
  /></a>`,
  styleUrl: './button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonLink {
  readonly link = input.required<string>();
  readonly queryParams = input<Record<string, string>>({});
  readonly variant = input<ButtonVariant>('secondary');
  readonly size = input<ButtonSize>('md');

  protected readonly classes = computed(() => buttonClasses(this.variant(), this.size()));
}
