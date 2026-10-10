<?php

namespace App\Http\Controllers\Api\V1\Discovery;

use App\Actions\Discovery\SearchAvailableArtists;
use App\Enums\Style;
use App\Http\Controllers\Controller;
use App\Http\Requests\Discovery\SearchArtistsRequest;
use App\Http\Resources\Discovery\HeadlinerResource;
use App\Http\Resources\Discovery\LineupCardResource;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class SearchController extends Controller
{
    /**
     * Artists free on the date who will drive to the event location: the headliner, then the
     * tickets closest first.
     *
     * @throws ThrottleRequestsException after 30 searches a minute from one address; see Retry-After
     */
    public function __invoke(SearchArtistsRequest $request, SearchAvailableArtists $search): AnonymousResourceCollection
    {
        $criteria = $request->criteria();
        $lineup = $search->handle($criteria);

        return LineupCardResource::collection($lineup->tickets)->additional([
            'headliner' => $lineup->headliner ? new HeadlinerResource($lineup) : null,
            'meta' => [
                /** How many artists are free and pass the filters, the headliner included. */
                'total' => $lineup->total(),
                /** @var 'closest'|'rating'|'price' */
                'sort' => $criteria->sort->value,
                /** @var list<string> */
                'styles' => array_map(fn (Style $style) => $style->value, $criteria->filter->styles),
                /** `under-800` when the price chip is on. */
                'price' => $criteria->filter->under800 ? SearchArtistsRequest::UNDER_800 : null,
            ],
        ]);
    }
}
