<?php

namespace App\Http\Controllers\Api\V1\ArtistOnboarding;

use App\Actions\ArtistOnboarding\AppendApplicationVideoChunk;
use App\Actions\ArtistOnboarding\StartApplicationVideoUpload;
use App\Actions\ArtistOnboarding\UploadOffsetMismatch;
use App\Http\Controllers\Controller;
use App\Http\Requests\ArtistOnboarding\StartApplicationVideoUploadRequest;
use App\Http\Resources\ArtistOnboarding\ApplicationVideoResource;
use App\Models\ArtistVideo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/**
 * An applicant's video upload before any account exists (apply-as-artist, ADR-0026): start it, send
 * it in chunks, ask where it got to after a drop, and watch it go Live.
 */
class ApplicationVideoUploadsController extends Controller
{
    /** Chunks are `application/offset+octet-stream`, 8 MB at most (the route's `uploads:8192`). */
    public const CHUNK_TYPE = 'application/offset+octet-stream';

    /**
     * Start a video upload.
     *
     * Answers the token every chunk, offset question and the application itself name, and
     * `Location`, where the chunks go.
     */
    public function store(StartApplicationVideoUploadRequest $request, StartApplicationVideoUpload $start): JsonResponse
    {
        $video = $start->handle($request->validated('title'), $request->validated('fileName'), (int) $request->validated('size'));

        return (new ApplicationVideoResource($video))->response()->setStatusCode(201)
            ->header('Location', route('artist-applications.videos.show', $video->upload_token));
    }

    /**
     * Append a chunk.
     *
     * The body is the bytes from `Upload-Offset`, which must be where the upload ends; the answer's
     * `Upload-Offset` is where the next chunk starts. The last chunk sends the file through the scan
     * and the transcoder.
     *
     * @response 204
     *
     * @throws UploadOffsetMismatch 409 `upload-offset-mismatch`, with the upload's `Upload-Offset`
     */
    public function append(Request $request, string $token, AppendApplicationVideoChunk $append): Response
    {
        abort_unless(str_starts_with(strtolower((string) $request->header('Content-Type')), self::CHUNK_TYPE), 415);
        $video = $this->find($token);
        $offset = $append->handle($video, (int) $request->header('Upload-Offset', '0'), $request->getContent());

        return response()->noContent()->header('Upload-Offset', (string) $offset);
    }

    /**
     * The upload's state.
     *
     * `Upload-Offset` and `Upload-Length` say where it is (also answered to HEAD, to resume after a
     * dropped connection); the body says whether it is still uploading, processing, live or failed.
     */
    public function show(string $token): JsonResponse
    {
        $video = $this->find($token);

        return (new ApplicationVideoResource($video))->response()
            ->header('Upload-Offset', (string) $video->uploaded_bytes)
            ->header('Upload-Length', (string) $video->size_bytes);
    }

    private function find(string $token): ArtistVideo
    {
        return ArtistVideo::where('upload_token', $token)->firstOrFail();
    }
}
