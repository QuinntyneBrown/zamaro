import { NgTemplateOutlet } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  Directive,
  inject,
  input,
  output,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { Icon } from '../icon/icon';
import { Skeleton } from '../skeleton/skeleton';

/** One column of a table (table CRD). */
export interface TableColumn {
  /** The row field shown as text when no cell template matches; also the sort and template key. */
  key: string;
  /** One or two nouns. */
  header: string;
  /** The header text is visually hidden ("Actions"). */
  headerHidden?: boolean;
  /** `end` right-aligns the header and cells (money, counts). */
  align?: 'start' | 'end';
  /** The actions column: right-aligned and never wrapped. */
  actions?: boolean;
  /** The header holds a sort button. */
  sortable?: boolean;
  /** The row-header column stays in view while the table scrolls sideways. */
  sticky?: boolean;
  /** The loading placeholder for the column; `medium` by default. */
  skeleton?: 'short' | 'medium' | 'long' | 'control';
}

export interface TableSort {
  key: string;
  direction: 'ascending' | 'descending';
}

/** Replaces the text of one column's cells: `<ng-template zmTableCell="status" let-row>`. */
@Directive({ selector: 'ng-template[zmTableCell]' })
export class TableCell {
  readonly key = input.required<string>({ alias: 'zmTableCell' });
  readonly template = inject<TemplateRef<{ $implicit: unknown }>>(TemplateRef);
}

let nextId = 0;

/**
 * Records lined up to compare (docs/design-system/components/table): a native table with a caption,
 * column headers, a row header per record, an optional fixed or button-driven sort, dense and sticky
 * variants, skeleton rows while loading, and templates for rich cells. The page fetches, filters and
 * pages; the table only renders (table CRD). Selection and the bulk bar join with the availability
 * calendar (M4).
 */
@Component({
  selector: 'zm-table',
  imports: [Icon, NgTemplateOutlet, Skeleton],
  template: `<div class="table-wrap" role="region" tabindex="0" [attr.aria-labelledby]="captionId">
    <table
      class="table"
      [class.table--dense]="dense()"
      [class.table--sticky]="stickyHeader()"
      [attr.aria-busy]="loading() ? 'true' : null"
    >
      <caption [id]="captionId" [class.visually-hidden]="captionHidden()">
        {{
          caption()
        }}
        @if (loading()) {
          <span class="visually-hidden"> {{ loadingLabel() }}</span>
        }
      </caption>
      <thead>
        <tr>
          @for (column of columns(); track column.key) {
            <th
              scope="col"
              [class.table__num]="column.align === 'end'"
              [class.table__actions]="column.actions"
              [class.table__first]="column.sticky"
              [attr.aria-sort]="sort()?.key === column.key ? sort()?.direction : null"
            >
              @if (column.sortable) {
                <button class="table__sort" type="button" (click)="toggleSort(column)">
                  {{ column.header }} <zm-icon name="arrow-right" size="sm" />
                </button>
              } @else if (column.headerHidden) {
                <span class="visually-hidden">{{ column.header }}</span>
              } @else {
                {{ column.header }}
              }
            </th>
          }
        </tr>
      </thead>
      <tbody>
        @if (loading()) {
          @for (index of skeletonRows(); track index) {
            <tr>
              @for (column of columns(); track column.key) {
                <td
                  [class.table__num]="column.align === 'end'"
                  [class.table__actions]="column.actions"
                >
                  @if (column.skeleton === 'control') {
                    <zm-skeleton shape="control" />
                  } @else {
                    <zm-skeleton shape="text" [width]="column.skeleton ?? 'medium'" />
                  }
                </td>
              }
            </tr>
          }
        } @else {
          @for (row of rows(); track keyOf(row)) {
            <tr>
              @for (column of columns(); track column.key) {
                @if (column.key === headerKey()) {
                  <th scope="row" [class.table__first]="column.sticky">
                    <ng-container
                      [ngTemplateOutlet]="cell()"
                      [ngTemplateOutletContext]="{ row, column }"
                    />
                  </th>
                } @else {
                  <td
                    [class.table__num]="column.align === 'end'"
                    [class.table__actions]="column.actions"
                  >
                    <ng-container
                      [ngTemplateOutlet]="cell()"
                      [ngTemplateOutletContext]="{ row, column }"
                    />
                  </td>
                }
              }
            </tr>
          }
        }
      </tbody>
    </table>
    <ng-template #cellRenderer let-row="row" let-column="column">
      @if (templates()[column.key]; as template) {
        <ng-container
          [ngTemplateOutlet]="template"
          [ngTemplateOutletContext]="{ $implicit: row }"
        />
      } @else {
        {{ textOf(row, column) }}
      }
    </ng-template>
  </div>`,
  styles: `
    :host {
      display: block;
    }

    .table-wrap {
      position: relative;
      overflow-x: auto;
      border: var(--border-width-thick) solid var(--color-border-strong);
      background: var(--color-bg-surface);
    }

    .table-wrap:focus-visible {
      outline: var(--focus-ring-width) solid var(--color-focus-ring);
      outline-offset: var(--focus-ring-offset);
    }

    .table {
      width: 100%;
      border-collapse: collapse;
      font: var(--text-body-sm);
      font-variant-numeric: tabular-nums;
    }

    .table caption {
      text-align: left;
      padding: var(--space-3) var(--space-4);
      font: var(--text-h4);
      text-transform: uppercase;
      caption-side: top;
      border-bottom: var(--border-width-thick) solid var(--color-border-strong);
    }

    .table caption.visually-hidden {
      border: 0;
    }

    .table th,
    .table td {
      padding: var(--space-3) var(--space-4);
      text-align: left;
      vertical-align: middle;
      border-bottom: var(--border-width-hairline) solid var(--color-border-default);
    }

    .table thead th {
      font: var(--text-overline);
      letter-spacing: var(--letter-spacing-stamp);
      text-transform: uppercase;
      color: var(--color-fg-default);
      background: var(--color-bg-surface-sunken);
      border-bottom: var(--border-width-thick) solid var(--color-border-strong);
      white-space: nowrap;
    }

    .table tbody tr:last-child > * {
      border-bottom: 0;
    }

    .table tbody tr:hover > * {
      background: var(--color-bg-subtle);
    }

    .table td.table__num,
    .table th.table__num {
      text-align: right;
    }

    .table__actions {
      text-align: right;
      white-space: nowrap;
    }

    .table__sort {
      display: inline-flex;
      align-items: center;
      gap: var(--space-1);
      min-height: var(--target-min);
      padding: 0;
      border: 0;
      background: none;
      color: inherit;
      font: inherit;
      letter-spacing: inherit;
      text-transform: inherit;
      cursor: pointer;
    }

    .table__sort:focus-visible {
      outline: var(--focus-ring-width) solid var(--color-focus-ring);
      outline-offset: var(--focus-ring-offset);
    }

    /* The arrow points up for ascending, down for descending, and stays faint until sorted. */
    .table__sort zm-icon {
      rotate: -90deg;
      opacity: 0.4;
    }

    th[aria-sort] .table__sort zm-icon {
      opacity: 1;
    }

    th[aria-sort='descending'] .table__sort zm-icon {
      rotate: 90deg;
    }

    .table--dense th,
    .table--dense td {
      padding: var(--space-2) var(--space-3);
    }

    .table--sticky thead th {
      position: sticky;
      top: 0;
      z-index: var(--z-raised);
    }

    .table__first {
      position: sticky;
      left: 0;
      background: var(--color-bg-surface);
    }

    @media print {
      .table-wrap {
        overflow: visible;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Table<T extends object> {
  /** Names the table and its scrolling region: "Submitted, oldest first". */
  readonly caption = input.required<string>();
  readonly captionHidden = input(false, { transform: booleanAttribute });
  readonly columns = input.required<readonly TableColumn[]>();
  /** Already in display order. */
  readonly rows = input.required<readonly T[]>();
  /** The row field that tracks rows. */
  readonly rowKey = input('id');
  /** The column rendered as `<th scope="row">`; the first column by default. */
  readonly rowHeader = input<string>();
  /** The sorted column, whether fixed ("newest first") or chosen with a sort button. */
  readonly sort = input<TableSort | null>(null);
  readonly dense = input(false, { transform: booleanAttribute });
  readonly stickyHeader = input(false, { transform: booleanAttribute });
  /** Real caption and headers over skeleton rows, with `aria-busy`. */
  readonly loading = input(false, { transform: booleanAttribute });
  readonly loadingRows = input(3);
  /** Visually hidden caption suffix while loading: "(loading)". */
  readonly loadingLabel = input('');

  /** A sort button was activated: a new column ascending, the sorted column reversed. */
  readonly sortChange = output<TableSort>();

  protected readonly captionId = `zm-table-${++nextId}-caption`;
  private readonly cells = contentChildren(TableCell);

  protected readonly templates = computed<Record<string, TemplateRef<{ $implicit: unknown }>>>(() =>
    Object.fromEntries(this.cells().map((cell) => [cell.key(), cell.template])),
  );
  protected readonly headerKey = computed(() => this.rowHeader() ?? this.columns()[0]?.key);
  protected readonly skeletonRows = computed(() =>
    Array.from({ length: this.loadingRows() }, (_, index) => index),
  );

  /** The one cell renderer: a column's template when one matches, else the field as text. */
  protected readonly cell = viewChild.required<TemplateRef<unknown>>('cellRenderer');

  protected keyOf(row: T): unknown {
    return (row as Record<string, unknown>)[this.rowKey()];
  }

  protected textOf(row: T, column: TableColumn): string {
    const value = (row as Record<string, unknown>)[column.key];
    return value === null || value === undefined ? '' : String(value);
  }

  protected toggleSort(column: TableColumn): void {
    const current = this.sort();
    this.sortChange.emit({
      key: column.key,
      direction:
        current?.key === column.key && current.direction === 'ascending'
          ? 'descending'
          : 'ascending',
    });
  }
}
