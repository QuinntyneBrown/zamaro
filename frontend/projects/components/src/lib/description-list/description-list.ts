import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Skeleton } from '../skeleton/skeleton';

export interface DescriptionItem {
  /** A stable key. */
  id: string;
  /** "14 days or more before". */
  term: string;
  /** "Cancel free. Your deposit comes back in full." Line breaks render as `<br>`. */
  value?: string;
  /** A value that does not exist yet ("When Abigail accepts"). */
  muted?: boolean;
  /** Wraps the value in the yellow highlighter. */
  changed?: boolean;
  /** Receipt only: the total row, ruled above and below. */
  total?: boolean;
}

/**
 * Terms and their values (docs/specs/components/description-list): the definition style (an
 * overline term over its value, in one column or two), the stacked and horizontal lists, or a till
 * receipt. A real `<dl>`, so each term is read with its value.
 */
@Component({
  selector: 'zm-description-list',
  imports: [Skeleton],
  host: {
    '[attr.role]': "label() ? 'group' : null",
    '[attr.aria-label]': 'label() || null',
  },
  template: `<dl [class]="listClass()" [attr.aria-busy]="loading() ? 'true' : null">
      @for (row of rows(); track row.item.id) {
        <div
          [class.definition__row]="variant() === 'definition'"
          [class.receipt__row]="variant() === 'receipt'"
          [class.receipt__total]="row.total"
        >
          <dt>{{ row.item.term }}</dt>
          <dd [class.text-muted]="row.item.muted">
            <span>{{ row.plain }}</span>
            @if (row.rich) {
              @if (loading()) {
                <zm-skeleton width="medium" /><span class="visually-hidden">{{
                  loadingLabel()
                }}</span>
              } @else if (row.item.changed) {
                <mark class="mark">{{ row.item.value }}</mark>
              } @else if (row.lines) {
                @for (line of row.lines; track $index; let last = $last) {
                  <span>{{ line }}</span>
                  @if (!last) {
                    <br />
                  }
                }
              }
            }
          </dd>
        </div>
      }
    </dl>
    @if (variant() === 'receipt' && fine()) {
      <p class="receipt__fine">{{ fine() }}</p>
    }`,
  styles: `
    :host {
      display: block;
      min-width: 0;
    }

    dl {
      margin: 0;
    }

    dd {
      margin: 0;
    }

    .mark {
      background: var(--color-accent-subtle);
      padding-inline: var(--space-0-5);
    }

    .text-muted {
      color: var(--color-fg-muted);
    }

    /* Definition: an overline term over its value, two to a row from SM. */
    .definition {
      display: grid;
      gap: var(--space-4);
    }

    .definition__row {
      display: grid;
      align-content: start;
      gap: var(--space-0-5);
    }

    .definition dt,
    .dl dt {
      font: var(--text-overline);
      letter-spacing: var(--letter-spacing-stamp);
      text-transform: uppercase;
      color: var(--color-fg-muted);
    }

    @media (min-width: 36rem) {
      .definition--two {
        grid-template-columns: 1fr 1fr;
      }
    }

    /* Stack and horizontal (components.css .dl). */
    .dl {
      display: grid;
      gap: var(--space-3);
    }

    .dl > div {
      display: flex;
      flex-direction: column;
      gap: var(--space-0-5);
    }

    .dl dd {
      font: var(--text-body);
    }

    .dl--horizontal > div {
      display: grid;
      grid-template-columns: minmax(8rem, 1fr) 2fr;
      gap: var(--space-4);
      padding-block: var(--space-3);
      border-bottom: var(--border-width-hairline) solid var(--color-border-default);
    }

    .dl--horizontal dt {
      padding-top: var(--space-1);
    }

    .dl--stub dd {
      font: var(--text-stub);
      text-transform: uppercase;
    }

    /* Receipt: stub face, dashed rules, a thick-ruled total and fine print (components.css .receipt). */
    .receipt {
      display: grid;
      font: var(--text-stub);
      text-transform: uppercase;
    }

    .receipt__row {
      display: flex;
      justify-content: space-between;
      gap: var(--space-4);
      padding-block: var(--space-2);
      border-bottom: var(--border-width-hairline) dashed var(--color-border-strong);
    }

    .receipt__row dt {
      color: var(--color-fg-muted);
      font-weight: var(--font-weight-regular);
    }

    .receipt__row dd {
      min-width: 0;
      text-align: right;
      font-variant-numeric: tabular-nums;
      overflow-wrap: anywhere;
    }

    .receipt__total {
      padding-block: var(--space-3);
      border-top: var(--border-width-thick) solid var(--color-border-strong);
      border-bottom: var(--border-width-thick) solid var(--color-border-strong);
      font: var(--text-h4);
    }

    .receipt__total dt {
      color: var(--color-fg-default);
    }

    .receipt__fine {
      padding-top: var(--space-2);
      font: var(--text-caption);
      color: var(--color-fg-muted);
      text-transform: none;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DescriptionList {
  readonly items = input.required<readonly DescriptionItem[]>();
  readonly variant = input<'stack' | 'horizontal' | 'definition' | 'receipt'>('definition');
  /** Stack and horizontal: the stub face for values. */
  readonly stub = input(false);
  /** Definition only: `2` sets the rows in two columns from SM. */
  readonly columns = input<1 | 2>(1);
  /** Names the list as a group: "Payment summary for ZAM-0114". */
  readonly label = input<string>();
  /** Receipt only: fine print after the list. */
  readonly fine = input('');
  /** Terms stay; every value is a skeleton. */
  readonly loading = input(false);
  readonly loadingLabel = input('');

  /** The `<dl>` classes: the variant, then its modifiers. */
  protected readonly listClass = computed(() => {
    switch (this.variant()) {
      case 'receipt':
        return 'receipt';
      case 'definition':
        return this.columns() === 2 ? 'definition definition--two' : 'definition';
      case 'horizontal':
        return this.stub() ? 'dl dl--horizontal dl--stub' : 'dl dl--horizontal';
      default:
        return this.stub() ? 'dl dl--stub' : 'dl';
    }
  });

  /**
   * Each item with what its `<dd>` renders: the plain value in a static span for most rows, or a
   * rich block (skeleton, highlighter or several lines) only where one is needed, so an ordinary
   * row creates no embedded view (AC-10, D-5).
   */
  protected readonly rows = computed(() => {
    const receipt = this.variant() === 'receipt';
    const loading = this.loading();
    return this.items().map((item) => {
      const lines = item.value?.includes('\n') ? item.value.split('\n') : null;
      const rich = loading || item.changed === true || lines !== null;
      return {
        item,
        total: receipt && item.total === true,
        lines,
        rich,
        plain: rich ? '' : (item.value ?? ''),
      };
    });
  });
}
