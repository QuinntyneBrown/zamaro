import { Dialog as CdkDialog, DialogRef } from '@angular/cdk/dialog';
import { DOCUMENT } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  signal,
  viewChild,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import { ARTIST_CALENDAR_API, type CalendarFeed } from 'api';
import { Alert, Button, Dialog, FormField, Icon, Skeleton } from 'components';

const TITLE_ID = 'calendar-feed-title';
const DESCRIPTION_ID = 'calendar-feed-desc';

/** Opens "Subscribe in your calendar" (docs/mocks/dialogs/calendar-feed) over the calendar. */
export function openCalendarFeedDialog(injector: Injector): DialogRef<void, CalendarFeedDialog> {
  return injector.get(CdkDialog).open<void, void, CalendarFeedDialog>(CalendarFeedDialog, {
    ariaLabelledBy: TITLE_ID,
    ariaDescribedBy: DESCRIPTION_ID,
    ariaModal: true,
    autoFocus: false,
    restoreFocus: true,
    backdropClass: 'zm-backdrop',
    maxWidth: '100vw',
  });
}

/**
 * Where the dialog is: finding out whether the feed is on, the explanation before it is turned on
 * (`off`), the link (`on`), the confirmation before a new link, a request out, or a failure.
 */
type Status =
  | 'loading'
  | 'load-failed'
  | 'off'
  | 'turning-on'
  | 'on-failed'
  | 'on'
  | 'confirm'
  | 'making'
  | 'new-failed';

/**
 * L2-058: before the feed exists the dialog says what it lists and turns it on; afterwards it shows
 * the secret link with Copy link and offers a new link behind a confirmation. A failed request
 * keeps the current link working and offers Try again.
 */
@Component({
  selector: 'zm-calendar-feed-dialog',
  imports: [Alert, Button, Dialog, FormField, Icon, ReactiveFormsModule, Skeleton, TranslocoPipe],
  templateUrl: './calendar-feed.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarFeedDialog {
  protected readonly dialogRef = inject<DialogRef<void>>(DialogRef);
  private readonly api = inject(ARTIST_CALENDAR_API);
  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);

  protected readonly titleId = TITLE_ID;
  protected readonly descriptionId = DESCRIPTION_ID;
  protected readonly status = signal<Status>('loading');
  protected readonly feed = signal<CalendarFeed | null>(null);
  /** The link as the read-only field shows it. */
  protected readonly link = new FormControl('', { nonNullable: true });
  protected readonly copied = signal(false);
  protected readonly busy = computed(
    () => this.status() === 'turning-on' || this.status() === 'making',
  );
  /** Asking before a new link; a failed attempt goes back to the link with Try again. */
  protected readonly confirming = computed(
    () => this.status() === 'confirm' || this.status() === 'making',
  );
  protected readonly linkShown = computed(
    () => this.feed() !== null && (this.status() === 'on' || this.status() === 'new-failed'),
  );

  private readonly keepButton = viewChild('keepButton', { read: ElementRef<HTMLElement> });
  private readonly linkField = viewChild<FormField>('linkField');

  constructor() {
    this.load();
  }

  protected load(): void {
    this.status.set('loading');
    this.api.feed().subscribe({
      next: (feed) => {
        this.feed.set(feed);
        this.link.setValue(feed?.url ?? '');
        this.status.set(feed ? 'on' : 'off');
        if (feed) afterNextRender(() => this.linkField()?.focus(), { injector: this.injector });
      },
      error: () => this.status.set('load-failed'),
    });
  }

  protected turnOn(): void {
    if (this.busy()) return;
    this.status.set('turning-on');
    this.dialogRef.disableClose = true;
    this.api.enableFeed().subscribe({
      next: (feed) => {
        this.dialogRef.disableClose = false;
        this.feed.set(feed);
        this.link.setValue(feed.url);
        this.status.set('on');
        afterNextRender(() => this.linkField()?.focus(), { injector: this.injector });
      },
      error: () => {
        this.dialogRef.disableClose = false;
        this.status.set('on-failed');
      },
    });
  }

  /** "Make a new link" in the body asks first; "Keep current link" is focused (L2-101). */
  protected askForNewLink(): void {
    this.status.set('confirm');
    afterNextRender(() => this.keepButton()?.nativeElement.querySelector('button')?.focus(), {
      injector: this.injector,
    });
  }

  protected keepCurrentLink(): void {
    if (this.busy()) return;
    this.status.set('on');
    afterNextRender(() => this.linkField()?.focus(), { injector: this.injector });
  }

  protected makeNewLink(): void {
    if (this.busy()) return;
    this.status.set('making');
    this.dialogRef.disableClose = true;
    this.api.regenerateFeed().subscribe({
      next: (feed) => {
        this.dialogRef.disableClose = false;
        this.feed.set(feed);
        this.link.setValue(feed.url);
        this.copied.set(false);
        this.status.set('on');
        afterNextRender(() => this.linkField()?.focus(), { injector: this.injector });
      },
      error: () => {
        this.dialogRef.disableClose = false;
        this.status.set('new-failed');
      },
    });
  }

  protected async copy(): Promise<void> {
    const url = this.feed()?.url;
    if (!url) return;
    await this.document.defaultView?.navigator.clipboard?.writeText(url);
    this.copied.set(true);
  }

  protected close(): void {
    if (this.busy()) return;
    this.dialogRef.close();
  }
}
