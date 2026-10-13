<?php

namespace App\Actions\ArtistOnboarding;

use App\Enums\VideoStatus;
use App\Models\ArtistVideo;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

/**
 * One chunk of an applicant's video (ADR-0026): it must start where the upload ends, lands in
 * quarantine as its own part, and the last one hands the whole file to the upload pipeline. The row
 * is locked while a chunk is appended, so two chunks sent at once cannot both be accepted.
 */
class AppendApplicationVideoChunk
{
    /** Parts of one upload sit under this prefix on the quarantine disk, named by their offset. */
    public const PART_PREFIX = 'video-parts';

    public function __construct(private readonly CompleteApplicationVideoUpload $complete) {}

    /**
     * @return int the offset after this chunk
     *
     * @throws UploadOffsetMismatch when the chunk does not start where the upload ends
     * @throws ValidationException when the chunk runs past the declared size
     */
    public function handle(ArtistVideo $video, int $offset, string $chunk): int
    {
        $completed = DB::transaction(function () use ($video, $offset, $chunk): ?ArtistVideo {
            $video = ArtistVideo::whereKey($video->id)->lockForUpdate()->firstOrFail();
            if ($video->status !== VideoStatus::Uploading || $offset !== $video->uploaded_bytes) {
                throw new UploadOffsetMismatch($video->uploaded_bytes);
            }
            $end = $offset + strlen($chunk);
            if ($end > $video->size_bytes) {
                throw ValidationException::withMessages(['chunk' => 'This chunk runs past the size the upload was started with.']);
            }
            Storage::disk(config('zamaro.uploads.disks.quarantine'))->put(self::partKey($video, $offset), $chunk);
            $video->forceFill(['uploaded_bytes' => $end])->save();

            return $end === $video->size_bytes ? $video : null;
        });

        if ($completed !== null) {
            $this->complete->handle($completed);
        }

        return $offset + strlen($chunk);
    }

    public static function partKey(ArtistVideo $video, int $offset): string
    {
        return sprintf('%s/%s/%012d', self::PART_PREFIX, $video->upload_token, $offset);
    }
}
