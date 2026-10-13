import { DOCUMENT } from '@angular/common';
import { computed, inject, Injectable, signal } from '@angular/core';
import type { ActType, ApplicationVideo, ArtistApplication, Style } from 'api';

/** Where the draft lives on this device until the application is sent. */
const STORAGE_KEY = 'zamaro.application';

export interface AboutYou {
  name: string;
  email: string;
  city: string;
  act: ActType | '';
}

export interface YourMusic {
  styles: Style[];
  bio: string;
}

export interface PriceAndTravel {
  /** Whole dollars, as typed. */
  price: string;
  /** Kilometres, as chosen. */
  distance: string;
}

export interface ReferenceDraft {
  name: string;
  church: string;
  contact: string;
}

export interface ApplicationDraft {
  about: AboutYou;
  music: YourMusic;
  videos: ApplicationVideo[];
  price: PriceAndTravel;
  references: [ReferenceDraft, ReferenceDraft];
  /** Minted once per application, so a retry after a network failure creates at most one (L2-047.5). */
  idempotencyKey: string;
}

const EMPTY_REFERENCE: ReferenceDraft = { name: '', church: '', contact: '' };

/**
 * The application as the guest writes it (apply-as-artist): every step's answers, the uploaded
 * videos and the idempotency key, kept in browser storage on this device between steps and across
 * a reload, until the application is sent (L2-108.3). Nothing here reaches the server before Send.
 */
@Injectable()
export class ApplicationStore {
  private readonly storage = inject(DOCUMENT).defaultView?.sessionStorage ?? null;

  readonly draft = signal<ApplicationDraft>(this.restore());
  /** The application, once the API has it. */
  readonly sent = signal<ArtistApplication | null>(null);

  readonly videos = computed(() => this.draft().videos);
  readonly liveVideos = computed(() => this.videos().filter((video) => video.status === 'live'));

  patchAbout(about: AboutYou): void {
    this.update({ about });
  }

  patchMusic(music: YourMusic): void {
    this.update({ music });
  }

  patchPrice(price: PriceAndTravel): void {
    this.update({ price });
  }

  patchReferences(references: [ReferenceDraft, ReferenceDraft]): void {
    this.update({ references });
  }

  addVideo(video: ApplicationVideo): void {
    this.update({ videos: [...this.videos(), video] });
  }

  updateVideo(video: ApplicationVideo): void {
    this.update({
      videos: this.videos().map((known) => (known.token === video.token ? video : known)),
    });
  }

  removeVideo(token: string): void {
    this.update({ videos: this.videos().filter((video) => video.token !== token) });
  }

  /** The application is in: the draft leaves this device. */
  markSent(application: ArtistApplication): void {
    this.sent.set(application);
    try {
      this.storage?.removeItem(STORAGE_KEY);
    } catch {
      // Storage is a convenience; the page still works without it.
    }
  }

  private update(patch: Partial<ApplicationDraft>): void {
    const next = { ...this.draft(), ...patch };
    this.draft.set(next);
    try {
      this.storage?.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Storage is a convenience; the page still works without it.
    }
  }

  private restore(): ApplicationDraft {
    const empty: ApplicationDraft = {
      about: { name: '', email: '', city: '', act: '' },
      music: { styles: [], bio: '' },
      videos: [],
      price: { price: '', distance: '80' },
      references: [{ ...EMPTY_REFERENCE }, { ...EMPTY_REFERENCE }],
      idempotencyKey: this.mintKey(),
    };
    try {
      const raw = this.storage?.getItem(STORAGE_KEY);
      if (!raw) return empty;
      const saved = JSON.parse(raw) as Partial<ApplicationDraft>;
      return {
        ...empty,
        ...saved,
        about: { ...empty.about, ...saved.about },
        music: { ...empty.music, ...saved.music },
        price: { ...empty.price, ...saved.price },
        references: [
          { ...EMPTY_REFERENCE, ...saved.references?.[0] },
          { ...EMPTY_REFERENCE, ...saved.references?.[1] },
        ],
        videos: Array.isArray(saved.videos) ? saved.videos : [],
        idempotencyKey: saved.idempotencyKey || empty.idempotencyKey,
      };
    } catch {
      return empty;
    }
  }

  private mintKey(): string {
    const crypto = inject(DOCUMENT).defaultView?.crypto;
    if (crypto?.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
      const random = Math.floor(Math.random() * 16);
      return (char === 'x' ? random : (random & 0x3) | 0x8).toString(16);
    });
  }
}
