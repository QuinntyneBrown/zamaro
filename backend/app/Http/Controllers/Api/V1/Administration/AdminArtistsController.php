<?php

namespace App\Http\Controllers\Api\V1\Administration;

use App\Enums\ArtistStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Administration\ListAdminArtistsRequest;
use App\Http\Resources\Administration\AdminArtistDetailResource;
use App\Http\Resources\Administration\AdminArtistResource;
use App\Models\Artist;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Str;

/** The read-only Artists section (pages/admin-artists, pages/admin-artist; L2-067, M3 D18). */
class AdminArtistsController extends Controller
{
    /**
     * Every approved and suspended artist, A to Z.
     *
     * `q` narrows to artists whose name, base city or account email has a word starting with it ("Tobi"
     * does not match Etobicoke). The counts cover every artist, not the match.
     */
    public function index(ListAdminArtistsRequest $request): AnonymousResourceCollection
    {
        $query = Artist::query()->with('rating')->orderBy('display_name');
        if (filled($q = $request->validated('q'))) {
            $term = addcslashes(Str::lower(trim($q)), '%_\\');
            $starts = [$term.'%', '% '.$term.'%'];
            $query->where(fn (Builder $match) => $match
                ->whereRaw('(lower(display_name) like ? or lower(display_name) like ?)', $starts)
                ->orWhereRaw('(lower(base_city) like ? or lower(base_city) like ?)', $starts)
                ->orWhereHas('user', fn (Builder $user) => $user->whereRaw('(lower(email) like ? or lower(email) like ?)', $starts)));
        }

        return AdminArtistResource::collection($query->get())->additional([
            'meta' => [
                'total' => Artist::count(),
                'approved' => Artist::where('status', ArtistStatus::Approved)->count(),
                'suspended' => Artist::where('status', ArtistStatus::Suspended)->count(),
            ],
        ]);
    }

    /**
     * One artist.
     *
     * The account, the profile, the upcoming bookings and the standing (read only until M8).
     */
    public function show(Artist $artist): AdminArtistDetailResource
    {
        return new AdminArtistDetailResource($artist->load(['user', 'styles', 'rating']));
    }
}
