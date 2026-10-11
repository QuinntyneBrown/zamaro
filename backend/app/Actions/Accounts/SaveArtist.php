<?php

namespace App\Actions\Accounts;

use App\Enums\ArtistStatus;
use App\Models\Artist;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Saves an artist for a booker (L2-026): only an approved, published artist, at most 200 per booker.
 * The booker's row is locked so two saves at once cannot pass the limit together; saving twice is
 * the same as once.
 */
class SaveArtist
{
    public const LIMIT = 200;

    /**
     * @return array{savedCount: int, firstSave: bool}
     *
     * @throws SavedArtistLimit
     */
    public function handle(User $booker, int $artistId): array
    {
        abort_unless(Artist::whereKey($artistId)->where('status', ArtistStatus::Approved)->whereNotNull('published_at')->exists(), 404);

        return DB::transaction(function () use ($booker, $artistId) {
            $locked = User::whereKey($booker->id)->lockForUpdate()->firstOrFail();
            $saved = DB::table('saved_artists')->where('user_id', $booker->id);
            if (! (clone $saved)->where('artist_id', $artistId)->exists() && (clone $saved)->count() >= self::LIMIT) {
                throw new SavedArtistLimit;
            }
            DB::table('saved_artists')->insertOrIgnore(['user_id' => $booker->id, 'artist_id' => $artistId, 'created_at' => now()->toIso8601String()]);
            $firstSave = $locked->first_saved_at === null;
            if ($firstSave) {
                $locked->forceFill(['first_saved_at' => now()])->save();
            }

            return ['savedCount' => (clone $saved)->count(), 'firstSave' => $firstSave];
        });
    }
}
