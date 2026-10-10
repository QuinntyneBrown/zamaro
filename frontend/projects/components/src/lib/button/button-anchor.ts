import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { type ButtonSize, type ButtonVariant, buttonClasses } from './button';

/** A link to an address outside the app styled as a button, e.g. "Email the Zamaro team". */
@Component({
  selector: 'zm-button-anchor',
  template: `<a [class]="classes()" [href]="href()"><ng-content /></a>`,
  styleUrl: './button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonAnchor {
  /** `mailto:`, `https://…`. */
  readonly href = input.required<string>();
  readonly variant = input<ButtonVariant>('secondary');
  readonly size = input<ButtonSize>('md');

  protected readonly classes = computed(() => buttonClasses(this.variant(), this.size()));
}
