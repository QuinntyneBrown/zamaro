<?php

namespace App\Http\Controllers\Api\V1\Accounts;

use App\Actions\Accounts\SaveArtist;
use App\Actions\Accounts\SavedArtistLimit;
use App\Actions\Accounts\UnsaveArtist;
use App\Http\Controllers\Controller;
use App\Http\Resources\Accounts\SavedArtistStateResource;
use App\Services\Accounts\SavedArtistState;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/** A booker's saved artists (L2-026, accounts/save-artist); bookers only. */
class SavedArtistController extends Controller
{
    /**
     * The saved artists' ids.
     *
     * For the hearts on every ticket and the header's count.
     */
    public function ids(Request $request): JsonResponse
    {
        $ids = DB::table('saved_artists')->where('user_id', $request->user()->id)->pluck('artist_id')->map(fn ($id) => (int) $id)->all();

        return response()->json([
            'data' => [
                /** @var list<int> */
                'artistIds' => $ids,
                'count' => count($ids),
            ],
        ]);
    }

    /**
     * Save an artist.
     *
     * Saving twice is the same as once. 404 for an artist who is not approved and published.
     *
     * @throws SavedArtistLimit 422 `saved-artist-limit` when 200 are saved already
     */
    public function update(Request $request, SaveArtist $save, int $artist): SavedArtistStateResource
    {
        $state = $save->handle($request->user(), $artist);

        return new SavedArtistStateResource(new SavedArtistState($artist, true, $state['savedCount'], $state['firstSave']));
    }

    /**
     * Remove a saved artist.
     *
     * Removing one that was not saved changes nothing.
     */
    public function destroy(Request $request, UnsaveArtist $unsave, int $artist): SavedArtistStateResource
    {
        return new SavedArtistStateResource(new SavedArtistState($artist, false, $unsave->handle($request->user(), $artist), false));
    }
}
