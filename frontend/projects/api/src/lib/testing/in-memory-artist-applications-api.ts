import { type Observable, of, throwError } from 'rxjs';
import type {
  ApplicationVideo,
  ArtistApplication,
  ArtistApplicationInput,
} from '../models/artist-onboarding';
import type { ArtistApplicationsApi } from '../services/artist-onboarding/artist-applications';

/**
 * In-memory ArtistApplicationsApi for scenarios and component tests: uploads go live as soon as
 * their last byte is in, every application is A-0219 submitted on the mocks' Friday, and a repeated
 * key answers the same application.
 */
export class InMemoryArtistApplicationsApi implements ArtistApplicationsApi {
  private readonly videos = new Map<string, ApplicationVideo>();
  private readonly applications = new Map<string, ArtistApplication>();
  private nextToken = 1;

  startVideoUpload(title: string, fileName: string, size: number): Observable<ApplicationVideo> {
    const token = `token-${this.nextToken++}`.padEnd(64, '0');
    const video: ApplicationVideo = {
      token,
      status: 'uploading',
      title,
      fileName,
      size,
      offset: 0,
      durationSeconds: null,
      posterUrl: null,
      failureReason: null,
    };
    this.videos.set(token, video);
    return of({ ...video });
  }

  appendVideoChunk(token: string, offset: number, chunk: Blob): Observable<number> {
    const video = this.videos.get(token);
    if (!video || video.offset !== offset) return throwError(() => new Error('offset mismatch'));
    video.offset = offset + chunk.size;
    if (video.offset >= video.size) {
      video.status = 'live';
      video.durationSeconds = 348;
      video.posterUrl = `/media/applications/videos/${token}/poster-800.webp`;
    }
    return of(video.offset);
  }

  videoStatus(token: string): Observable<ApplicationVideo> {
    const video = this.videos.get(token);
    return video ? of({ ...video }) : throwError(() => new Error('not found'));
  }

  submit(
    application: ArtistApplicationInput,
    idempotencyKey: string,
  ): Observable<ArtistApplication> {
    const existing = this.applications.get(idempotencyKey);
    if (existing) return of(existing);
    const created: ArtistApplication = {
      id: this.applications.size + 1,
      number: 'A-0219',
      status: 'submitted',
      name: application.name,
      email: application.email,
      submittedAt: '2026-10-09T10:42:00-04:00',
      replyBy: '2026-10-15',
      skippedHolidays: [{ date: '2026-10-12', name: 'Thanksgiving' }],
      videos: application.videos.map((token) => ({
        token,
        title: this.videos.get(token)?.title ?? '',
        status: 'live',
      })),
      references: application.references.map(({ name, church }) => ({ name, church })),
    };
    this.applications.set(idempotencyKey, created);
    return of(created);
  }
}
