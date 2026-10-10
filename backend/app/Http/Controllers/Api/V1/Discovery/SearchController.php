<?php

namespace App\Http\Controllers\Api\V1\Discovery;

use App\Actions\Discovery\SearchAvailableArtists;
use App\Http\Controllers\Controller;
use App\Http\Requests\Discovery\SearchArtistsRequest;
use App\Http\Resources\Discovery\HeadlinerResource;
use App\Http\Resources\Discovery\LineupCardResource;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class SearchController extends Controller
{
    /**
     * Artists free on the date who will drive to the event location: the headliner, then the
     * tickets closest first.
     */
    public function __invoke(SearchArtistsRequest $request, SearchAvailableArtists $search): AnonymousResourceCollection
    {
        $lineup = $search->handle($request->criteria());

        return LineupCardResource::collection($lineup->tickets)->additional([
            'headliner' => $lineup->headliner ? new HeadlinerResource($lineup) : null,
            'meta' => [
                /** How many artists are free, the headliner included; the summary line shows it. */
                'total' => $lineup->total(),
            ],
        ]);
    }
}
