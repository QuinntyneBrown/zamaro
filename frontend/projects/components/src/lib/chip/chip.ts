import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** A toggle chip (docs/design-system/components/chip): inverse with a tick while pressed. */
@Component({
  selector: 'zm-chip',
  template: `<button
    class="chip"
    [class.chip--sm]="size() === 'sm'"
    type="button"
    [attr.aria-pressed]="pressed()"
    [disabled]="disabled()"
  >
    <ng-content />
  </button>`,
  styles: `
    :host {
      display: inline-flex;
    }

    .chip {
      --chip-bg: var(--color-bg-surface);
      --chip-fg: var(--color-fg-default);
      --chip-border: var(--color-border-strong);
      --chip-height: var(--target-comfortable);
      display: inline-flex;
      align-items: center;
      gap: var(--space-1);
      min-height: var(--chip-height);
      padding: 0 var(--space-4);
      font: var(--text-stub);
      text-transform: uppercase;
      letter-spacing: var(--letter-spacing-wide);
      color: var(--chip-fg);
      background: var(--chip-bg);
      border: var(--border-width-thick) solid var(--chip-border);
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: background var(--duration-fast) var(--ease-standard);
    }

    .chip:hover {
      --chip-bg: var(--color-accent-subtle);
    }

    .chip:active {
      --chip-bg: var(--color-accent-subtle-hover);
    }

    .chip[aria-pressed='true'] {
      --chip-bg: var(--color-bg-inverse);
      --chip-fg: var(--color-fg-inverse);
      --chip-border: var(--color-bg-inverse);
    }

    .chip[aria-pressed='true']::before {
      content: '✓' / '';
    }

    .chip:disabled {
      --chip-bg: var(--color-bg-subtle);
      --chip-fg: var(--color-fg-disabled);
      --chip-border: var(--color-fg-disabled);
      cursor: not-allowed;
    }

    .chip--sm {
      --chip-height: var(--control-height-sm);
      padding: 0 var(--space-3);
      font-size: var(--font-size-xs);
    }

    @media (pointer: coarse) {
      .chip--sm {
        --chip-height: var(--target-comfortable);
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Chip {
  readonly pressed = input(false);
  readonly size = input<'sm' | 'md'>('md');
  readonly disabled = input(false);
}
