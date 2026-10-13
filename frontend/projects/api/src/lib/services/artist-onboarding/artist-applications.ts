import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { map, type Observable } from 'rxjs';
import type {
  ApplicationVideo,
  ArtistApplication,
  ArtistApplicationInput,
} from '../../models/artist-onboarding';

/** A chunk's type on the wire (ADR-0026). */
export const VIDEO_CHUNK_TYPE = 'application/offset+octet-stream';

/** Chunks are 8 MB at most; the API refuses more. */
export const VIDEO_CHUNK_BYTES = 8 * 1024 * 1024;

/**
 * Applying as an artist (apply-as-artist, L2-047; ADR-0026 for the videos). Everything here is for a
 * guest: the upload token is the only key to a video, and the `Idempotency-Key` makes a retried
 * submission create at most one application.
 */
export interface ArtistApplicationsApi {
  /** Starts a video upload: its title, file name and size, for its token. */
  startVideoUpload(title: string, fileName: string, size: number): Observable<ApplicationVideo>;
  /** Appends the bytes from `offset`; answers the offset after them. */
  appendVideoChunk(token: string, offset: number, chunk: Blob): Observable<number>;
  /** Where the upload stands: uploading, processing, live or failed. */
  videoStatus(token: string): Observable<ApplicationVideo>;
  /** Sends the application; the same key on a retry answers the application already created. */
  submit(
    application: ArtistApplicationInput,
    idempotencyKey: string,
  ): Observable<ArtistApplication>;
}

export const ARTIST_APPLICATIONS_API = new InjectionToken<ArtistApplicationsApi>(
  'ArtistApplicationsApi',
);

@Injectable()
export class HttpArtistApplicationsApi implements ArtistApplicationsApi {
  private readonly http = inject(HttpClient);

  startVideoUpload(title: string, fileName: string, size: number): Observable<ApplicationVideo> {
    return this.http
      .post<{ data: ApplicationVideo }>('/api/v1/artist-applications/videos', {
        title,
        fileName,
        size,
      })
      .pipe(map((response) => response.data));
  }

  appendVideoChunk(token: string, offset: number, chunk: Blob): Observable<number> {
    return this.http
      .patch(`/api/v1/artist-applications/videos/${token}`, chunk, {
        headers: new HttpHeaders({
          'Content-Type': VIDEO_CHUNK_TYPE,
          'Upload-Offset': String(offset),
        }),
        observe: 'response',
      })
      .pipe(map((response) => Number(response.headers.get('Upload-Offset') ?? offset)));
  }

  videoStatus(token: string): Observable<ApplicationVideo> {
    return this.http
      .get<{ data: ApplicationVideo }>(`/api/v1/artist-applications/videos/${token}`)
      .pipe(map((response) => response.data));
  }

  submit(
    application: ArtistApplicationInput,
    idempotencyKey: string,
  ): Observable<ArtistApplication> {
    return this.http
      .post<{ data: ArtistApplication }>('/api/v1/artist-applications', application, {
        headers: new HttpHeaders({ 'Idempotency-Key': idempotencyKey }),
      })
      .pipe(map((response) => response.data));
  }
}
