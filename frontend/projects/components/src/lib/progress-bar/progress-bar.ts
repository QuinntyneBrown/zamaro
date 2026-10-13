import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  numberAttribute,
} from '@angular/core';

let nextId = 0;

/**
 * A ruled track that fills with ink while a long task moves along (docs/specs/components/
 * progress-bar): "Uploading way-maker.mp4 · 46%". With no value it slides a block instead, for a
 * wait with no measurable share ("Processing"). The dialog or page owns the status region and the
 * sentence under the bar.
 */
@Component({
  selector: 'zm-progress-bar',
  host: {
    class: 'progress',
    '[class.progress--indeterminate]': 'value() === null',
    '[class.progress--success]': "variant() === 'success'",
    '[class.progress--danger]': "variant() === 'danger'",
  },
  template: `<div class="progress__head">
      <span [id]="labelId">{{ label() }}</span>
      @if (valueText()) {
        <span class="progress__value">{{ valueText() }}</span>
      }
    </div>
    <div
      class="progress__track"
      role="progressbar"
      [attr.aria-labelledby]="labelId"
      aria-valuemin="0"
      [attr.aria-valuemax]="safeMax()"
      [attr.aria-valuenow]="clamped()"
      [attr.aria-valuetext]="ariaValueText() || valueText() || null"
    >
      <div class="progress__bar" [style.--progress]="share()"></div>
    </div>`,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
      min-width: 0;
    }

    .progress__head {
      display: flex;
      justify-content: space-between;
      gap: var(--space-2);
      font: var(--text-overline);
      letter-spacing: var(--letter-spacing-stamp);
      text-transform: uppercase;
    }

    .progress__value {
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }

    .progress__track {
      position: relative;
      height: var(--space-3);
      background: var(--color-bg-surface);
      border: var(--border-width-thick) solid var(--color-border-strong);
      overflow: hidden;
    }

    .progress__bar {
      --progress-fill: var(--color-accent);
      height: 100%;
      width: var(--progress, 0%);
      background: var(--progress-fill);
      border-right: var(--border-width-thick) solid var(--color-border-on-accent);
      transition: width var(--duration-base) var(--ease-standard);
    }

    :host(.progress--indeterminate) .progress__bar {
      width: 35%;
      border-left: var(--border-width-thick) solid var(--color-border-on-accent);
      animation: progress-slide calc(var(--duration-loop) * 1.6) var(--ease-standard) infinite;
    }

    :host(.progress--success) .progress__bar {
      --progress-fill: var(--color-success-solid);
    }

    :host(.progress--danger) .progress__bar {
      --progress-fill: var(--color-danger-solid);
    }

    @keyframes progress-slide {
      from {
        transform: translateX(-100%);
      }
      to {
        transform: translateX(300%);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .progress__bar {
        transition: none;
      }

      :host(.progress--indeterminate) .progress__bar {
        animation: none;
        width: 100%;
        opacity: 0.4;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressBar {
  /** The task: "Uploading way-maker.mp4". */
  readonly label = input.required<string>();
  /** Progress in units of `max`; null is indeterminate. */
  readonly value = input<number | null>(null);
  readonly max = input(100, { transform: numberAttribute });
  /** "46%", "2 of 4", "Up to 5 min". */
  readonly valueText = input('');
  /** `aria-valuetext` when a number alone is unclear: "46%, about 2 minutes left". */
  readonly ariaValueText = input('');
  readonly variant = input<'default' | 'success' | 'danger'>('default');

  protected readonly labelId = `zm-progress-${nextId++}`;
  protected readonly safeMax = computed(() => (this.max() > 0 ? this.max() : 100));
  protected readonly clamped = computed(() => {
    const value = this.value();
    if (value === null) return null;
    return Math.min(this.safeMax(), Math.max(0, Number.isFinite(value) ? value : 0));
  });
  protected readonly share = computed(() => {
    const value = this.clamped();
    return value === null ? null : `${(value / this.safeMax()) * 100}%`;
  });
}
