import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  linkedSignal,
  output,
  signal,
  untracked,
} from '@angular/core';
import { Button } from '../button/button';
import { Icon } from '../icon/icon';
import { Skeleton } from '../skeleton/skeleton';

/** How a day reads on the grid (L2-056): Free, Unavailable (`blocked`), Requested or Booked. */
export type CalendarGridStatus = 'free' | 'blocked' | 'requested' | 'booked';

/** One day of the month the page hands the grid, already worded. */
export interface CalendarGridDay {
  /** `YYYY-MM-DD`. */
  date: string;
  status: CalendarGridStatus;
  /** The button's accessible name: "Sat 14 Nov, Requested · 1, Riverside Community Church". */
  label: string;
  /** The short line under the number from MD: "Harvest Point", "Weekly", "Requested · 1". */
  event?: string | null;
  /** False for a Booked day, which stays discoverable but cannot be selected (L2-057.1). */
  selectable?: boolean;
}

export interface CalendarWeekday {
  /** "Sun". */
  short: string;
  /** "Sunday", read in its place. */
  long: string;
}

export interface CalendarLegendItem {
  status: CalendarGridStatus;
  label: string;
}

/** Where the grid turns the page from the keyboard, and which day to land on afterwards. */
export interface CalendarPageTurn {
  direction: 'previous' | 'next';
  /** The day of the month to focus once the month arrives, clamped to its length; `last` for the end. */
  focus: number | 'last';
}

interface Cell {
  key: string;
  day: CalendarGridDay | null;
  number: number;
}

const WEEK = 7;

/**
 * One month of an artist's calendar (docs/design-system/components/calendar): an APG grid of day
 * buttons, each Free, Unavailable, Requested with its count or Booked, with the month pager and the
 * legend over it. Arrow keys move a day or a week, Home and End reach the ends of the week, Page Up
 * and Page Down turn the month, Space or Enter selects, Shift with an arrow extends the selection and
 * Escape clears it. The page owns the selection: it passes `selected` and takes `selectedChange`.
 * Activating a day that cannot be selected, or a Requested one, also raises `dayActivated` so the
 * page can say why. Project the caption under the grid as content.
 */
@Component({
  selector: 'zm-calendar',
  imports: [Button, Icon, Skeleton],
  host: {
    class: 'calendar',
    role: 'region',
    '[attr.aria-label]': 'label()',
  },
  templateUrl: './calendar.html',
  styleUrl: './calendar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Calendar {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** The region's name: "Calendar, next 18 months". */
  readonly label = input.required<string>();
  /** `YYYY-MM`. */
  readonly month = input.required<string>();
  /** "November 2026", the grid's heading. */
  readonly monthTitle = input.required<string>();
  readonly monthId = input('calendar-month');
  /** Every day of the month, in order. */
  readonly days = input.required<readonly CalendarGridDay[]>();
  /** The seven weekdays from Sunday. */
  readonly weekdays = input.required<readonly CalendarWeekday[]>();
  readonly legend = input<readonly CalendarLegendItem[]>([]);
  readonly legendLabel = input('');
  /** "Previous month, October 2026". */
  readonly previousLabel = input.required<string>();
  readonly nextLabel = input.required<string>();
  readonly canGoBack = input(true);
  readonly canGoForward = input(true);
  /** Today, `YYYY-MM-DD`, underlined when it is in the month. */
  readonly today = input<string | null>(null);
  /** The selected dates. */
  readonly selected = input<readonly string[]>([]);
  /** Skeleton days in place of the month. */
  readonly loading = input(false, { transform: booleanAttribute });
  /** Announced once while loading; leave it empty when the page announces the wait itself. */
  readonly loadingLabel = input('');

  readonly monthChange = output<CalendarPageTurn>();
  readonly selectedChange = output<string[]>();
  readonly dayActivated = output<CalendarGridDay>();

  /** The day that holds the roving tabindex, once one has been focused. */
  private readonly focused = signal<string | null>(null);
  /** Where a Shift+arrow range starts. */
  private readonly anchor = signal<string | null>(null);
  /** The day to focus once a page turn from the keyboard lands. */
  private readonly landing = signal<number | 'last' | null>(null);

  protected readonly weeks = computed<Cell[][]>(() => {
    const [year, monthNumber] = this.month().split('-').map(Number);
    const first = new Date(Date.UTC(year, monthNumber - 1, 1));
    const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
    const daysBefore = new Date(Date.UTC(year, monthNumber - 1, 0)).getUTCDate();
    const lead = first.getUTCDay();
    const byDate = new Map(this.days().map((day) => [day.date, day]));
    const cells: Cell[] = [];
    for (let index = lead; index > 0; index -= 1) {
      const number = daysBefore - index + 1;
      cells.push({ key: `before-${number}`, day: null, number });
    }
    for (let number = 1; number <= daysInMonth; number += 1) {
      const date = `${this.month()}-${String(number).padStart(2, '0')}`;
      cells.push({ key: date, day: byDate.get(date) ?? null, number });
    }
    for (let number = 1; cells.length % WEEK !== 0; number += 1) {
      cells.push({ key: `after-${number}`, day: null, number });
    }
    const weeks: Cell[][] = [];
    for (let start = 0; start < cells.length; start += WEEK) {
      weeks.push(cells.slice(start, start + WEEK));
    }
    return weeks;
  });

  protected readonly loadingWeeks = computed(() =>
    Array.from({ length: this.weeks().length }, () => Array.from({ length: WEEK }, (_, i) => i)),
  );

  /**
   * The selection as the grid shows it: the page's `selected` once it lands, and the change the
   * grid just made before that, so two quick activations never lose each other.
   */
  private readonly selection = linkedSignal<readonly string[]>(() => this.selected());
  private readonly selectedSet = computed(() => new Set(this.selection()));

  /** The one day in the tab order: the focused day, else the first selected, else today, else the first selectable. */
  protected readonly tabbable = computed(() => {
    const days = this.days();
    const focused = this.focused();
    if (focused && days.some((day) => day.date === focused)) return focused;
    const selected = days.find((day) => this.selectedSet().has(day.date));
    if (selected) return selected.date;
    const today = this.today();
    if (today && days.some((day) => day.date === today)) return today;
    return days.find((day) => day.selectable !== false)?.date ?? days[0]?.date ?? null;
  });

  constructor() {
    // A page turn from the keyboard lands focus on the matching day once the month arrives.
    effect(() => {
      const days = this.days();
      const landing = untracked(this.landing);
      if (landing === null || days.length === 0) return;
      this.landing.set(null);
      const index = landing === 'last' ? days.length - 1 : Math.min(landing, days.length) - 1;
      const date = days[index]?.date;
      if (!date) return;
      this.focused.set(date);
      queueMicrotask(() => this.focusDate(date));
    });
  }

  protected isSelected(date: string): boolean {
    return this.selectedSet().has(date);
  }

  protected number(date: string): number {
    return Number(date.slice(8));
  }

  protected onFocus(day: CalendarGridDay): void {
    this.focused.set(day.date);
  }

  protected activate(day: CalendarGridDay): void {
    if (day.selectable === false) {
      this.dayActivated.emit(day);
      return;
    }
    if (day.status === 'requested') this.dayActivated.emit(day);
    this.anchor.set(day.date);
    const next = new Set(this.selectedSet());
    if (next.has(day.date)) next.delete(day.date);
    else next.add(day.date);
    this.changeSelection(next);
  }

  protected onKeydown(event: KeyboardEvent, day: CalendarGridDay): void {
    const days = this.days();
    const index = days.findIndex((candidate) => candidate.date === day.date);
    if (index < 0) return;
    const lastIndex = days.length - 1;
    const weekday = new Date(`${day.date}T00:00:00Z`).getUTCDay();
    let target: number;
    switch (event.key) {
      case 'ArrowLeft':
        target = index - 1;
        break;
      case 'ArrowRight':
        target = index + 1;
        break;
      case 'ArrowUp':
        target = index - WEEK;
        break;
      case 'ArrowDown':
        target = index + WEEK;
        break;
      case 'Home':
        target = Math.max(0, index - weekday);
        break;
      case 'End':
        target = Math.min(lastIndex, index + (WEEK - 1 - weekday));
        break;
      case 'PageUp':
        event.preventDefault();
        this.turn('previous', index + 1);
        return;
      case 'PageDown':
        event.preventDefault();
        this.turn('next', index + 1);
        return;
      case 'Escape':
        if (this.selection().length === 0) return;
        event.preventDefault();
        this.anchor.set(null);
        this.changeSelection(new Set());
        return;
      default:
        return;
    }
    event.preventDefault();
    if (target < 0) {
      this.turn('previous', 'last');
      return;
    }
    if (target > lastIndex) {
      this.turn('next', 1);
      return;
    }
    const landing = days[target];
    if (!landing) return;
    this.focused.set(landing.date);
    this.focusDate(landing.date);
    if (event.shiftKey) this.extendTo(landing.date);
  }

  protected turnPage(direction: 'previous' | 'next'): void {
    this.monthChange.emit({ direction, focus: 1 });
  }

  private turn(direction: 'previous' | 'next', focus: number | 'last'): void {
    if (direction === 'previous' ? !this.canGoBack() : !this.canGoForward()) return;
    this.landing.set(focus);
    this.monthChange.emit({ direction, focus });
  }

  /** Shift with an arrow: every selectable day between the anchor and the focused day joins the selection. */
  private extendTo(date: string): void {
    const anchor = this.anchor() ?? date;
    const [from, to] = anchor <= date ? [anchor, date] : [date, anchor];
    const next = new Set(this.selectedSet());
    for (const day of this.days()) {
      if (day.date >= from && day.date <= to && day.selectable !== false) next.add(day.date);
    }
    if (!this.anchor()) this.anchor.set(anchor);
    this.changeSelection(next);
  }

  private changeSelection(dates: Set<string>): void {
    const ordered = [...dates].sort();
    this.selection.set(ordered);
    this.selectedChange.emit(ordered);
  }

  private focusDate(date: string): void {
    const button = this.host.nativeElement.querySelector<HTMLButtonElement>(
      `.calendar__day[data-date="${date}"]`,
    );
    button?.focus();
  }
}
