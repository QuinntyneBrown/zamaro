import { HttpErrorResponse } from '@angular/common/http';
import { computed, effect, inject, Injectable, signal, untracked } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { AuthService, SAVED_ARTISTS_API } from 'api';
import { ToastService } from 'components';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { PendingIntentService } from './pending-intent.service';

/** An artist as a heart or a Save button knows them. */
export interface SavableArtist {
  id: number;
  name: string;
  pronoun: 'she' | 'he' | 'they';
}

/**
 * The signed-in booker's saved artists (accounts/save-artist, L2-026): which hearts are filled and
 * the header's count, loaded once after sign-in. A press flips the heart at once, then the server's
 * answer sets the count; a failure flips it back and says so (L2-109).
 */
@Injectable({ providedIn: 'root' })
export class SavedArtistsStore {
  private readonly api = inject(SAVED_ARTISTS_API);
  private readonly auth = inject(AuthService);
  private readonly toasts = inject(ToastService);
  private readonly transloco = inject(TranslocoService);
  private readonly router = inject(Router);
  private readonly intents = inject(PendingIntentService);

  private readonly ids = signal<ReadonlySet<number>>(new Set());
  private readonly busyIds = signal<ReadonlySet<number>>(new Set());
  readonly count = signal(0);

  /**
   * Bookers save; artists and administrators browsing do not. Nor does a booker the terms gate is
   * holding (L2-080.3): their calls would be refused until they accept.
   */
  readonly enabled = computed(() => {
    const user = this.auth.currentUser();
    const roles = user?.roles ?? [];
    return roles.includes('booker') && !roles.includes('artist') && !user?.termsAcceptanceRequired;
  });

  /**
   * Hearts and the profile's Save show to guests too, whose press starts sign-in (L2-026.3), but not
   * to artists or administrators.
   */
  readonly shown = computed(() => {
    const user = this.auth.currentUser();
    return !user || (user.roles.includes('booker') && !user.roles.includes('artist'));
  });

  constructor() {
    effect(() => {
      const enabled = this.enabled();
      untracked(() => (enabled ? this.load() : this.reset()));
    });
    // Someone who signed in and cannot save drops a guest's held Save.
    effect(() => {
      if (this.auth.currentUser() && !this.shown()) untracked(() => this.intents.take());
    });
  }

  /**
   * A heart or the profile's Save pressed. A guest's press is held and they go to sign in, coming back
   * here (L2-026.3).
   */
  press(artist: SavableArtist, save: boolean): void {
    if (!this.auth.currentUser()) {
      const returnUrl = this.router.url;
      this.intents.hold({
        kind: 'save-artist',
        artistId: artist.id,
        ...this.named(artist),
        returnUrl,
      });
      void this.router.navigate(['/sign-in'], { queryParams: { returnUrl } });
      return;
    }
    void this.toggle(artist, save).catch(() => undefined);
  }

  has(id: number): boolean {
    return this.ids().has(id);
  }

  pending(id: number): boolean {
    return this.busyIds().has(id);
  }

  /**
   * Saves or removes `artist`. Undo and Try again come back here; an undo shows no toast of its own.
   * Resolves once the server answered; rejects when it refused.
   */
  async toggle(artist: SavableArtist, save: boolean, { quiet = false } = {}): Promise<void> {
    if (this.pending(artist.id) || this.has(artist.id) === save) return;
    this.set(artist.id, save);
    this.count.update((count) => count + (save ? 1 : -1));
    this.busyIds.update((ids) => new Set(ids).add(artist.id));
    try {
      const state = await firstValueFrom(
        save ? this.api.save(artist.id) : this.api.unsave(artist.id),
      );
      this.count.set(state.savedCount);
      if (!quiet) this.confirm(artist, save, state.savedCount, state.firstSave);
    } catch (error) {
      this.set(artist.id, !save);
      this.count.update((count) => count + (save ? -1 : 1));
      this.refused(artist, save, error);
      throw error;
    } finally {
      this.busyIds.update((ids) => {
        const next = new Set(ids);
        next.delete(artist.id);
        return next;
      });
    }
  }

  private confirm(artist: SavableArtist, save: boolean, count: number, firstSave: boolean): void {
    const title = this.t(save ? 'saved.title' : 'removed.title', { name: artist.name });
    this.toasts.show({
      kind: this.t(save ? 'saved.kind' : 'removed.kind'),
      title,
      text: save
        ? this.t('saved.text', { count })
        : this.t('removed.text', { pronoun: artist.pronoun, count }),
      icon: 'heart',
      key: `saved-${artist.id}`,
      dismissLabel: this.t('dismiss', { title }),
      actions: [
        {
          label: this.t('undo'),
          ariaLabel: this.t(save ? 'undoSave' : 'undoRemove', { name: artist.name }),
          run: () => void this.toggle(artist, !save, { quiet: true }).catch(() => undefined),
        },
      ],
    });
    if (firstSave) {
      const introTitle = this.t('private.title');
      this.toasts.show({
        variant: 'info',
        kind: this.t('private.kind'),
        title: introTitle,
        text: this.t('private.text'),
        dismissLabel: this.t('dismiss', { title: introTitle }),
        actions: [{ label: this.t('private.action'), link: '/saved' }],
      });
    }
  }

  private refused(artist: SavableArtist, save: boolean, error: unknown): void {
    const limit =
      error instanceof HttpErrorResponse &&
      error.status === 422 &&
      String(error.error?.type ?? '').endsWith('/saved-artist-limit');
    if (limit) {
      const title = this.t('limit.title');
      this.toasts.show({
        variant: 'warning',
        kind: this.t('limit.kind'),
        title,
        text: this.t('limit.text', { name: artist.name }),
        dismissLabel: this.t('dismiss', { title: title.replace(/\.$/, '') }),
        actions: [{ label: this.t('limit.action'), link: '/saved' }],
      });
      return;
    }
    const title = this.t(save ? 'failed.saveTitle' : 'failed.removeTitle', { name: artist.name });
    this.toasts.show({
      variant: 'danger',
      kind: this.t('failed.kind'),
      title,
      text: this.t(save ? 'failed.saveText' : 'failed.removeText', { pronoun: artist.pronoun }),
      key: `saved-${artist.id}`,
      dismissLabel: this.t('dismiss', {
        title: this.t(save ? 'failed.saveShort' : 'failed.removeShort', { name: artist.name }),
      }),
      actions: [{ label: this.t('failed.tryAgain'), run: () => this.toggle(artist, save) }],
    });
  }

  private load(): void {
    this.api.ids().subscribe({
      next: ({ artistIds, count }) => {
        this.ids.set(new Set(artistIds));
        this.count.set(count);
        this.replay();
      },
      error: () => undefined,
    });
  }

  /** A Save the booker pressed as a guest, now that they are signed in. */
  private replay(): void {
    const intent = this.intents.take();
    if (!intent) return;
    void this.toggle(
      { id: intent.artistId, name: intent.name, pronoun: intent.pronoun },
      true,
    ).catch(() => undefined);
  }

  private named(artist: SavableArtist): Pick<SavableArtist, 'name' | 'pronoun'> {
    return { name: artist.name, pronoun: artist.pronoun };
  }

  private reset(): void {
    this.ids.set(new Set());
    this.count.set(0);
  }

  private set(id: number, saved: boolean): void {
    this.ids.update((ids) => {
      const next = new Set(ids);
      if (saved) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  private t(key: string, params: Record<string, unknown> = {}): string {
    return this.transloco.translate(`common.savedArtists.${key}`, params);
  }
}
