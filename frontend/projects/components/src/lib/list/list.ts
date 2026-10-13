import { NgTemplateOutlet } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  input,
} from '@angular/core';
import { Skeleton } from '../skeleton/skeleton';
import { ListTrail } from './list-trail';

export interface ListItem {
  /** The item's key. */
  id: string;
  /** `.list__title`; in the device variant, the device ("Chrome on Windows"). */
  title?: string;
  /** One muted line; in the device variant, place and activity. */
  meta?: string;
  /** Grid items: shown as `<code>` ("7kq4-m2xd"). */
  code?: string;
}

export type ListVariant = 'default' | 'grid' | 'device';

/**
 * Short records read one at a time (docs/specs/components/list): static facts, a grid of codes, or
 * the signed-in devices. Each item has a title and at most one muted line, and an optional trail
 * (a badge or one small button) from the `zmListTrail` template. The interactive variant and avatars
 * join with their first screens.
 */
@Component({
  selector: 'zm-list',
  imports: [NgTemplateOutlet, Skeleton],
  template: `<ng-template #rows>
      @if (loading()) {
        @for (row of loadingRows(); track row) {
          <li class="list__item" aria-hidden="true">
            <div class="list__content">
              <zm-skeleton shape="text" width="medium" />
              <zm-skeleton shape="text" width="short" />
            </div>
          </li>
        }
      } @else {
        @for (item of items(); track item.id) {
          @switch (variant()) {
            @case ('device') {
              <li>
                <span
                  ><strong>{{ item.title }}</strong
                  ><span class="text-muted">{{ item.meta }}</span></span
                >
                @if (trail(); as t) {
                  <ng-container *ngTemplateOutlet="t.template; context: { $implicit: item }" />
                }
              </li>
            }
            @case ('grid') {
              <li class="list__item">
                <code>{{ item.code }}</code>
              </li>
            }
            @default {
              <li class="list__item">
                <div class="list__content">
                  @if (item.title) {
                    <span class="list__title">{{ item.title }}</span>
                  }
                  @if (item.meta) {
                    <span class="list__meta">{{ item.meta }}</span>
                  }
                </div>
                @if (trail(); as t) {
                  <span class="list__trail"
                    ><ng-container *ngTemplateOutlet="t.template; context: { $implicit: item }"
                  /></span>
                }
              </li>
            }
          }
        }
      }
      @if (loading() && loadingLabel()) {
        <li class="visually-hidden">{{ loadingLabel() }}</li>
      }
    </ng-template>
    @if (ordered()) {
      <ol
        role="list"
        [class]="classes()"
        [attr.aria-label]="labelledBy() ? null : label() || null"
        [attr.aria-labelledby]="labelledBy() || null"
      >
        <ng-container *ngTemplateOutlet="rows" />
      </ol>
    } @else {
      <ul
        role="list"
        [class]="classes()"
        [attr.aria-label]="labelledBy() ? null : label() || null"
        [attr.aria-labelledby]="labelledBy() || null"
      >
        <ng-container *ngTemplateOutlet="rows" />
      </ul>
    }`,
  styles: `
    :host {
      display: block;
    }

    .list {
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .list__item {
      display: flex;
      align-items: center;
      gap: var(--space-4);
      padding: var(--space-3) 0;
    }

    .list--divided > .list__item + .list__item {
      border-top: var(--border-width-hairline) solid var(--color-border-default);
    }

    .list--grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-2) var(--space-5);
    }

    .list--grid > .list__item {
      padding: 0;
    }

    .list__content {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-width: 0;
    }

    .list__title {
      font: var(--text-label);
    }

    .list__meta {
      font: var(--text-body-sm);
      color: var(--color-fg-muted);
    }

    .list__trail {
      margin-left: auto;
      flex: none;
    }

    .device-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
    }

    .device-list > li {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-2) var(--space-4);
      padding-block: var(--space-3);
      border-bottom: var(--border-width-hairline) solid var(--color-border-default);
    }

    .device-list > li > span:first-child {
      display: grid;
      gap: var(--space-0-5);
      font: var(--text-body-sm);
    }

    .device-list strong {
      font: var(--text-label);
      text-transform: uppercase;
      letter-spacing: var(--letter-spacing-wide);
    }

    .text-muted {
      color: var(--color-fg-muted);
    }

    @media (forced-colors: active) {
      .list--divided > .list__item + .list__item,
      .device-list > li {
        border-color: CanvasText;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class List {
  readonly items = input.required<readonly ListItem[]>();
  readonly variant = input<ListVariant>('default');
  /** A hairline between items (the device list always has one). */
  readonly divided = input(false, { transform: booleanAttribute });
  /** `<ol>` instead of `<ul>`. */
  readonly ordered = input(false, { transform: booleanAttribute });
  /** The list's name: "10 recovery codes". */
  readonly label = input<string>();
  /** The `id` of the element that names the list; wins over `label`. */
  readonly labelledBy = input<string>();
  readonly loading = input(false, { transform: booleanAttribute });
  readonly loadingCount = input(3);
  /** Visually hidden "Loading" while `loading`. */
  readonly loadingLabel = input('');

  protected readonly trail = contentChild(ListTrail);
  protected readonly loadingRows = computed(() =>
    Array.from({ length: this.loadingCount() }, (_, i) => i),
  );
  protected readonly classes = computed(() => {
    const variant = this.variant();
    if (variant === 'device') return 'device-list';
    return [
      'list',
      variant === 'grid' ? 'list--grid' : '',
      this.divided() && variant === 'default' ? 'list--divided' : '',
    ]
      .filter(Boolean)
      .join(' ');
  });
}
