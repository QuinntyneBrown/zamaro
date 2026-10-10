import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { Icon, type IconName } from '../icon/icon';

export type InlineMessageVariant = 'hint' | 'info' | 'success' | 'warning' | 'danger';

const ICON_FOR: Record<InlineMessageVariant, IconName> = {
  hint: 'info',
  info: 'info',
  success: 'check',
  warning: 'warning',
  danger: 'warning',
};

/**
 * One short line of status beside what it describes (docs/design-system/components/inline-message):
 * "Abigail is free Sat 14 Nov". Give it an `id` and point the subject's `aria-describedby` at it;
 * with `live` a change of text or variant is announced. The icon carries the tone, so the text has
 * no typed symbols.
 */
@Component({
  selector: 'zm-inline-message',
  imports: [Icon],
  host: {
    '[class]': 'classes()',
    '[attr.role]': "live() ? 'status' : null",
    '[style.display]': "block() ? 'flex' : null",
  },
  template: `<span class="inline-msg__icon"><zm-icon [name]="iconName()" size="sm" /></span
    ><ng-content />`,
  styles: `
    :host {
      --msg-fg: var(--color-fg-muted);
      display: inline-flex;
      align-items: flex-start;
      gap: var(--space-1);
      font: var(--text-caption);
      font-weight: var(--font-weight-bold);
      color: var(--msg-fg);
    }

    :host(.inline-msg--info) {
      --msg-fg: var(--color-info-fg);
    }

    :host(.inline-msg--success) {
      --msg-fg: var(--color-success-fg);
    }

    :host(.inline-msg--warning) {
      --msg-fg: var(--color-warning-fg);
    }

    :host(.inline-msg--danger) {
      --msg-fg: var(--color-danger-fg);
    }

    .inline-msg__icon {
      display: inline-flex;
      flex: none;
      margin-top: var(--space-0-5);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InlineMessage {
  readonly variant = input<InlineMessageVariant>('hint');
  /** Replaces the variant's icon, e.g. `shield` on the admin decision panel. */
  readonly icon = input<IconName>();
  /** Takes its own line, like a paragraph. */
  readonly block = input(false, { transform: booleanAttribute });
  /** Announces changes politely (`role="status"`); keep the same instance and change its inputs. */
  readonly live = input(false, { transform: booleanAttribute });

  protected readonly classes = computed(() =>
    this.variant() === 'hint' ? 'inline-msg' : `inline-msg inline-msg--${this.variant()}`,
  );
  protected readonly iconName = computed(() => this.icon() ?? ICON_FOR[this.variant()]);
}
