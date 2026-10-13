import { NgTemplateOutlet } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { RADIO_CHILD, RADIO_GROUP } from './radio-group';

/**
 * One option of a `zm-radio-group` (docs/specs/components/radio-group): a native radio in its
 * label, drawn as a light choice row, a full radio row, a framed stub or a choice card, as the group
 * says. Its label is the projected content; `description` is the second line.
 */
@Component({
  selector: 'zm-radio',
  imports: [NgTemplateOutlet],
  providers: [{ provide: RADIO_CHILD, useExisting: Radio }],
  host: { '[class.full]': "group.variant() === 'card'" },
  template: `<ng-template #content><ng-content /></ng-template>
    @switch (group.variant()) {
      @case ('radio') {
        <label class="radio">
          <input
            type="radio"
            [id]="id()"
            [name]="group.name()"
            [value]="value()"
            [checked]="checked()"
            [disabled]="isDisabled()"
            [required]="group.isFirst(this)"
            [attr.aria-invalid]="group.invalid() ? 'true' : null"
            (change)="group.choose(value())"
          />
          <span class="radio__dot"></span>
          <span class="radio__text"
            ><span><ng-container [ngTemplateOutlet]="content" /></span>
            @if (description()) {
              <span class="radio__desc">{{ description() }}</span>
            }
          </span>
        </label>
      }
      @case ('card') {
        <label class="choice-card">
          <input
            type="radio"
            [id]="id()"
            [name]="group.name()"
            [value]="value()"
            [checked]="checked()"
            [disabled]="isDisabled()"
            [required]="group.isFirst(this)"
            [attr.aria-invalid]="group.invalid() ? 'true' : null"
            (change)="group.choose(value())"
          />
          <span class="stack stack--sm"
            ><span class="choice-card__title"><ng-container [ngTemplateOutlet]="content" /></span>
            @if (description()) {
              <span class="choice-card__meta">{{ description() }}</span>
            }
          </span>
        </label>
      }
      @default {
        <label class="choice" [class.choice--stub]="group.variant() === 'stub'">
          <input
            type="radio"
            [id]="id()"
            [name]="group.name()"
            [value]="value()"
            [checked]="checked()"
            [disabled]="isDisabled()"
            [required]="group.isFirst(this)"
            [attr.aria-invalid]="group.invalid() ? 'true' : null"
            (change)="group.choose(value())"
          />
          <span class="choice__text"
            ><span><ng-container [ngTemplateOutlet]="content" /></span>
            @if (description()) {
              <small>{{ description() }}</small>
            }
          </span>
        </label>
      }
    }`,
  styles: `
    :host {
      display: block;
      min-width: 0;
    }

    :host(.full) {
      display: contents;
    }

    /* Choice and stub rows: a 20 px dot in a 44 px row (components.css .choice). */
    .choice {
      display: flex;
      gap: var(--space-3);
      align-items: flex-start;
      min-height: var(--target-comfortable);
      padding-block: var(--space-2);
      font: var(--text-body);
      cursor: pointer;
    }

    .choice input {
      appearance: none;
      flex: none;
      width: 1.25rem;
      height: 1.25rem;
      margin: 0.15rem 0 0;
      display: grid;
      place-content: center;
      background: var(--color-bg-surface);
      border: var(--border-width-thick) solid var(--color-border-strong);
      border-radius: var(--radius-full);
      cursor: pointer;
      transition:
        background-color var(--duration-fast) var(--ease-standard),
        border-color var(--duration-fast) var(--ease-standard);
    }

    .choice input:focus-visible {
      outline: var(--focus-ring-width) solid var(--color-focus-ring);
      outline-offset: var(--focus-ring-offset);
      box-shadow: 0 0 0 var(--focus-ring-offset) var(--color-bg-canvas);
    }

    .choice input:checked {
      background: var(--color-accent);
      border-color: var(--color-fg-on-accent);
    }

    .choice input:checked::before {
      content: '';
      width: 0.5rem;
      height: 0.5rem;
      border-radius: var(--radius-full);
      background: var(--color-fg-on-accent);
    }

    .choice input[aria-invalid='true'] {
      border-color: var(--color-danger-border);
    }

    .choice input:disabled {
      background: var(--color-bg-subtle);
      border-color: var(--color-border-default);
      cursor: not-allowed;
    }

    .choice input:checked:disabled {
      background: var(--color-accent);
    }

    .choice input:disabled + * {
      color: var(--color-fg-disabled);
    }

    .choice__text {
      display: flex;
      flex-direction: column;
      gap: var(--space-0-5);
      min-width: 0;
    }

    .choice__text small {
      font: var(--text-body-sm);
      color: var(--color-fg-muted);
    }

    .choice--stub {
      padding: var(--space-3) var(--space-4);
      border: var(--border-width-thick) solid var(--color-border-strong);
      background: var(--color-bg-surface);
    }

    .choice--stub:has(input:checked) {
      background: var(--color-accent-subtle);
    }

    /* Radio rows: a 24 px drawn dot beside a title and a description (components.css .radio). */
    .radio {
      position: relative;
      display: flex;
      gap: var(--space-3);
      align-items: flex-start;
      min-height: var(--target-min);
      cursor: pointer;
    }

    .radio > input {
      position: absolute;
      opacity: 0;
      width: 1px;
      height: 1px;
      margin: 0;
    }

    .radio__dot {
      --control-bg: var(--color-bg-surface);
      --control-border: var(--color-border-strong);
      --control-fg: var(--color-fg-on-accent);
      flex: none;
      display: inline-grid;
      place-items: center;
      width: var(--target-min);
      height: var(--target-min);
      background: var(--control-bg);
      color: var(--control-fg);
      border: var(--border-width-thick) solid var(--control-border);
      border-radius: var(--radius-full);
      transition: background var(--duration-fast) var(--ease-standard);
    }

    .radio__dot::after {
      content: '';
      width: 0.625rem;
      height: 0.625rem;
      border-radius: var(--radius-full);
      background: currentColor;
      visibility: hidden;
    }

    .radio__text {
      display: flex;
      flex-direction: column;
      padding-top: var(--space-0-5);
    }

    .radio__desc {
      font: var(--text-body-sm);
      color: var(--color-fg-muted);
    }

    .radio:hover .radio__dot {
      --control-bg: var(--color-accent-subtle);
    }

    .radio > input:checked + .radio__dot {
      --control-bg: var(--color-accent);
      --control-border: var(--color-border-on-accent);
    }

    .radio > input:checked + .radio__dot::after {
      visibility: visible;
    }

    .radio > input:focus-visible + .radio__dot {
      outline: var(--focus-ring-width) solid var(--color-focus-ring);
      outline-offset: var(--focus-ring-offset);
    }

    .radio > input[aria-invalid='true'] + .radio__dot {
      --control-border: var(--color-danger-border);
    }

    .radio > input:disabled + .radio__dot {
      --control-bg: var(--color-bg-subtle);
      --control-border: var(--color-fg-disabled);
      --control-fg: var(--color-fg-disabled);
    }

    .radio:has(> input:disabled) {
      color: var(--color-fg-disabled);
      cursor: not-allowed;
    }

    /* Choice cards: a framed answer with a title and a detail line (components.css .choice-card). */
    .choice-card {
      --choice-border: var(--color-border-strong);
      position: relative;
      display: flex;
      gap: var(--space-3);
      padding: var(--space-4);
      cursor: pointer;
      background: var(--color-bg-surface);
      border: var(--border-width-thick) solid var(--choice-border);
      transition:
        box-shadow var(--duration-fast) var(--ease-standard),
        transform var(--duration-fast) var(--ease-standard);
    }

    .choice-card > input {
      position: absolute;
      opacity: 0;
      width: 1px;
      height: 1px;
    }

    .choice-card:hover {
      box-shadow: var(--shadow-1);
      transform: var(--transform-lift);
    }

    .choice-card:has(> input:checked) {
      --choice-border: var(--color-border-selected);
      box-shadow: inset 0 0 0 var(--border-width-thick) var(--color-border-selected);
      background: var(--color-accent-subtle);
    }

    .choice-card:has(> input:focus-visible) {
      outline: var(--focus-ring-width) solid var(--color-focus-ring);
      outline-offset: var(--focus-ring-offset);
    }

    .choice-card:has(> input[aria-invalid='true']) {
      --choice-border: var(--color-danger-border);
    }

    .choice-card:has(> input:disabled) {
      --choice-border: var(--color-fg-disabled);
      background: var(--color-bg-subtle);
      color: var(--color-fg-disabled);
      cursor: not-allowed;
      box-shadow: none;
      transform: none;
    }

    .choice-card__title {
      font: var(--text-h4);
      text-transform: uppercase;
    }

    .choice-card__meta {
      font: var(--text-body-sm);
      color: var(--color-fg-muted);
    }

    .stack {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Radio {
  /** The native `value`, and the group's value when chosen. */
  readonly value = input.required<string>();
  /** The second line: "Burlington is 44 km from Brampton". */
  readonly description = input<string>();
  /** Locks this one option. */
  readonly disabled = input(false, { transform: booleanAttribute });

  protected readonly group = inject(RADIO_GROUP);
  protected readonly id = computed(() => `${this.group.name()}-${this.value()}`);
  protected readonly checked = computed(() => this.group.value() === this.value());
  protected readonly isDisabled = computed(() => this.disabled() || this.group.disabled());

  constructor() {
    this.group.register(this);
  }
}
