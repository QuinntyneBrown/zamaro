import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { type ApplicationVideo, ARTIST_APPLICATIONS_API, VIDEO_CHUNK_BYTES } from 'api';
import { Button, FormField, Icon, ProgressBar } from 'components';
import { concatMap, from, type Observable, switchMap, takeWhile, timer } from 'rxjs';
import { ApplicationStore } from './application.store';

/** How often a processing video is asked about. */
const POLL_MS = 1500;

/** The videos already attached, and the title and file for the next (apply-as-artist, L2-052). */
@Component({
  selector: 'zm-application-video-upload',
  imports: [Button, FormField, Icon, ProgressBar, ReactiveFormsModule, TranslocoPipe],
  templateUrl: './video-upload.html',
  styleUrl: './video-upload.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VideoUpload {
  /** The form's error for the videos, from the error summary. */
  readonly error = input<string | null>(null);
  readonly readonly = input(false);

  protected readonly store = inject(ApplicationStore);
  private readonly api = inject(ARTIST_APPLICATIONS_API);
  private readonly transloco = inject(TranslocoService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly title = new FormControl('', { nonNullable: true });
  protected readonly titleError = signal<string | null>(null);
  protected readonly uploadError = signal<string | null>(null);
  /** The upload in flight: its token and how far it is. */
  protected readonly uploading = signal<{
    token: string;
    fileName: string;
    percent: number;
  } | null>(null);
  protected readonly videos = computed(() => this.store.videos());

  /** "way-maker.mp4 · 0.3 MB · 5:48 · Live". */
  protected facts(video: ApplicationVideo): string {
    const size = this.transloco.translate('apply.videos.mb', { mb: this.megabytes(video.size) });
    const status = this.statusText(video);
    if (video.status === 'live' && video.durationSeconds !== null) {
      return this.transloco.translate('apply.videos.facts', {
        file: video.fileName,
        size,
        duration: this.duration(video.durationSeconds),
        status,
      });
    }
    return this.transloco.translate('apply.videos.factsUploading', {
      file: video.fileName,
      size,
      status,
    });
  }

  protected statusText(video: ApplicationVideo): string {
    if (video.status === 'uploading') {
      return this.transloco.translate('apply.videos.status.uploading', {
        percent: this.percent(video),
      });
    }
    if (video.status === 'failed' && video.failureReason) return video.failureReason;
    return this.transloco.translate(`apply.videos.status.${video.status}`);
  }

  protected percent(video: ApplicationVideo): number {
    return video.size > 0 ? Math.min(100, Math.floor((video.offset / video.size) * 100)) : 0;
  }

  protected remove(video: ApplicationVideo): void {
    this.store.removeVideo(video.token);
  }

  /** The file picked: the title must be there first, then the chunks go, then the server works. */
  protected picked(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    const title = this.title.value.trim();
    if (title.length < 5 || title.length > 100) {
      this.titleError.set(this.transloco.translate('apply.videos.needTitle'));
      return;
    }
    this.titleError.set(null);
    this.uploadError.set(null);
    this.api
      .startVideoUpload(title, file.name, file.size)
      .pipe(
        switchMap((video) => {
          this.store.addVideo(video);
          this.uploading.set({ token: video.token, fileName: file.name, percent: 0 });
          return this.sendChunks(video, file);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (video) => this.store.updateVideo(video),
        error: () => {
          const token = this.uploading()?.token;
          if (token) this.store.removeVideo(token);
          this.uploading.set(null);
          this.uploadError.set(
            this.transloco.translate('apply.videos.uploadFailed', { file: file.name }),
          );
        },
        complete: () => {
          this.uploading.set(null);
          this.title.setValue('');
        },
      });
  }

  /** Every chunk in turn, then the server's answers until the video is live or failed. */
  private sendChunks(video: ApplicationVideo, file: File): Observable<ApplicationVideo> {
    const offsets: number[] = [];
    for (let offset = 0; offset < file.size; offset += VIDEO_CHUNK_BYTES) offsets.push(offset);
    let known = video;
    return from(offsets).pipe(
      concatMap((offset) =>
        this.api.appendVideoChunk(
          video.token,
          offset,
          file.slice(offset, Math.min(file.size, offset + VIDEO_CHUNK_BYTES)),
        ),
      ),
      switchMap((offset) => {
        known = { ...known, offset, status: offset >= file.size ? 'processing' : 'uploading' };
        this.uploading.update((state) =>
          state
            ? { ...state, percent: Math.min(100, Math.floor((offset / file.size) * 100)) }
            : state,
        );
        if (offset < file.size) return from([known]);
        return timer(POLL_MS, POLL_MS).pipe(
          switchMap(() => this.api.videoStatus(video.token)),
          takeWhile(
            (latest) => latest.status === 'processing' || latest.status === 'uploading',
            true,
          ),
        );
      }),
    );
  }

  private megabytes(bytes: number): string {
    const mb = bytes / 1_048_576;
    return mb >= 10 ? String(Math.round(mb)) : (Math.round(mb * 10) / 10).toFixed(1);
  }

  /** "5:48". */
  private duration(seconds: number): string {
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  }
}
