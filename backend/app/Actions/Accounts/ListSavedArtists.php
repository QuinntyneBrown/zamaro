<?php

namespace App\Actions\Accounts;

use App\Models\Artist;
use App\Models\User;
use App\Services\Accounts\SavedArtistCard;
use App\Services\Accounts\SavedArtistList;
use App\Services\ArtistAvailability\AvailabilityService;
use App\Services\Discovery\Coordinates;
use App\Services\Discovery\DistanceService;
use Carbon\CarbonImmutable;

/**
 * A booker's saved artists (L2-027): visible artists only, newest save first, each free or booked on
 * the date with one availability query for the whole list, measured from the booker's church. An
 * artist who is suspended stays saved and returns when the suspension is lifted. At most 200, so the
 * list is not paged.
 */
class ListSavedArtists
{
    public function __construct(
        private readonly AvailabilityService $availability,
        private readonly DistanceService $distances,
    ) {}

    public function handle(User $booker, ?CarbonImmutable $date): SavedArtistList
    {
        $artists = Artist::query()
            ->visible()
            ->join('saved_artists', 'saved_artists.artist_id', '=', 'artists.id')
            ->where('saved_artists.user_id', $booker->id)
            ->orderByDesc('saved_artists.created_at')
            ->orderByDesc('saved_artists.id')
            ->select('artists.*', 'saved_artists.created_at as saved_at')
            ->with(['styles', 'rating'])
            ->get();

        $free = $date === null ? null : array_flip($this->availability->freeArtistIds($artists->pluck('id')->all(), $date));
        $church = $booker->church;
        $distances = $church === null || $artists->isEmpty() ? [] : $this->distances->fromOrigin(
            new Coordinates((float) $church->latitude, (float) $church->longitude),
            $artists->mapWithKeys(fn (Artist $artist) => [$artist->id => new Coordinates($artist->base_latitude, $artist->base_longitude)])->all(),
        );

        return new SavedArtistList(
            $artists->map(fn (Artist $artist) => new SavedArtistCard(
                $artist,
                $distances[$artist->id] ?? null,
                CarbonImmutable::parse((string) $artist->getAttribute('saved_at')),
                $free === null ? null : isset($free[$artist->id]),
            ))->values()->all(),
            $date,
        );
    }
}
