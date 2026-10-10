<?php

namespace App\Http\Controllers\Api\V1\Discovery;

use App\Actions\Discovery\SearchAvailableArtists;
use App\Http\Controllers\Controller;
use App\Http\Requests\Discovery\SearchArtistsRequest;
use App\Http\Resources\Discovery\LineupCardResource;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class SearchController extends Controller
{
    /**
     * Artists free on the date who will drive to the event location.
     */
    public function __invoke(SearchArtistsRequest $request, SearchAvailableArtists $search): AnonymousResourceCollection
    {
        $cards = $search->handle($request->criteria());

        return LineupCardResource::collection($cards)->additional([
            'meta' => [
                /** How many artists are free; the summary line shows it. */
                'total' => count($cards),
            ],
        ]);
    }
}
