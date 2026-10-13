<?php

namespace App\Console\Commands;

use App\Actions\ArtistOnboarding\AppendApplicationVideoChunk;
use App\Models\ArtistVideo;
use App\Models\Upload;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

/**
 * `uploads:prune-unattached`: an applicant's video that no application claimed within 24 hours goes,
 * with its parts, its original, its renditions and its upload row (apply-as-artist, M3 D7).
 */
class PruneUnattachedUploadsCommand extends Command
{
    public const KEEP_HOURS = 24;

    protected $signature = 'uploads:prune-unattached';

    protected $description = 'Delete application videos no application claimed within 24 hours, and their files';

    public function handle(): int
    {
        $quarantine = Storage::disk(config('zamaro.uploads.disks.quarantine'));
        $originals = Storage::disk(config('zamaro.uploads.disks.originals'));
        $media = Storage::disk(config('zamaro.media.disk'));
        $deleted = 0;

        ArtistVideo::unattached()->where('created_at', '<', now()->subHours(self::KEEP_HOURS))->orderBy('created_at')
            ->each(function (ArtistVideo $video) use ($quarantine, $originals, $media, &$deleted) {
                $quarantine->deleteDirectory(AppendApplicationVideoChunk::PART_PREFIX.'/'.$video->upload_token);
                $upload = $video->upload_id === null ? null : Upload::find($video->upload_id);
                if ($upload?->quarantine_key !== null) {
                    $quarantine->delete($upload->quarantine_key);
                }
                if ($upload?->object_key !== null) {
                    $originals->delete($upload->object_key);
                }
                if ($video->manifest_key !== null) {
                    $media->deleteDirectory(dirname($video->manifest_key));
                }
                $video->delete();
                $upload?->delete();
                $deleted++;
            });

        $this->info(sprintf('Deleted %d unattached video%s.', $deleted, $deleted === 1 ? '' : 's'));

        return self::SUCCESS;
    }
}
