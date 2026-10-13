import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { type ButtonSize, type ButtonVariant, buttonClasses } from './button';

/**
 * A route link styled as a button, e.g. the headliner's "See Abigail’s profile". An address outside
 * the app is `zm-button-anchor`; keeping them apart keeps each free of a conditional slot.
 */
@Component({
  selector: 'zm-button-link',
  imports: [RouterLink],
  template: `<a
    [class]="classes()"
    [routerLink]="link()"
    [queryParams]="queryParams()"
    [fragment]="fragment()"
    ><ng-content
  /></a>`,
  styleUrl: './button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonLink {
  readonly link = input.required<string>();
  readonly queryParams = input<Record<string, string>>({});
  /** An in-page target: `email` for "Change email again" to `/account#email`. */
  readonly fragment = input<string>();
  readonly variant = input<ButtonVariant>('secondary');
  readonly size = input<ButtonSize>('md');
  /** Fills its container: "Keep browsing artists" on the sign-up card. */
  readonly block = input(false, { transform: booleanAttribute });

  protected readonly classes = computed(() =>
    buttonClasses(this.variant(), this.size(), false, this.block()),
  );
}
