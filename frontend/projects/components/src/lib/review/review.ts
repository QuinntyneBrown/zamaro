import { ChangeDetectionStrategy, Component, computed, input, isDevMode } from '@angular/core';

/** Splits plain text on blank lines; single line breaks become spaces. Never parsed as HTML. */
function paragraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim().replace(/\s*\n\s*/g, ' '))
    .filter(Boolean);
}

/**
 * One church's review (docs/specs/components/review.md): the quote under a yellow quote mark, its
 * whole stars read as one image, the reviewer and "{church}, {town} · {month year}", then the
 * artist's reply when there is one and any actions the page projects into `[slot=actions]`. The
 * page owns the list item, the order and the paging.
 */
@Component({
  selector: 'zm-review',
  host: { class: 'stack stack--sm' },
  templateUrl: './review.html',
  styleUrl: './review.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Review {
  /** The church's words, 20–1,000 characters, plain text; a blank line starts a paragraph. */
  readonly quote = input.required<string>();
  /** Whole stars, 1–5; anything else is clamped. */
  readonly stars = input.required<number>();
  /** The stars' accessible name: "5 out of 5 stars". */
  readonly starsLabel = input.required<string>();
  /** "Rev. Janet Clarke". */
  readonly reviewer = input.required<string>();
  /** "St. Brendan’s Anglican, Oshawa · September 2026". */
  readonly source = input.required<string>();
  /** The artist's reply, plain text, or null for none. */
  readonly reply = input<string | null>(null);
  /** "Reply from Abigail Mensah · October 2026". */
  readonly replyMeta = input('');

  protected readonly quoteParagraphs = computed(() => paragraphs(this.quote()));
  protected readonly replyParagraphs = computed(() => {
    const reply = this.reply();
    return reply === null ? [] : paragraphs(reply);
  });

  protected readonly starGlyphs = computed(() => {
    const stars = this.stars();
    const whole = Math.min(5, Math.max(1, Math.round(stars)));
    if (whole !== stars && isDevMode()) {
      console.error(`zm-review: stars must be a whole number from 1 to 5, got ${stars}.`);
    }
    return '★'.repeat(whole) + '☆'.repeat(5 - whole);
  });
}
