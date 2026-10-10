<?php

namespace App\Http\Controllers\Api\V1\Discovery;

use App\Actions\Discovery\FindSearchAlternatives;
use App\Http\Controllers\Controller;
use App\Http\Requests\Discovery\SearchArtistsRequest;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Illuminate\Http\JsonResponse;

class SearchAlternativesController extends Controller
{
    /**
     * Ways forward when a search finds nobody: nearby dates with their counts, a wider radius and
     * whether filters apply. Takes the search's own parameters; the cursor is ignored.
     *
     * @throws ThrottleRequestsException after 30 searches a minute from one address; see Retry-After
     */
    public function __invoke(SearchArtistsRequest $request, FindSearchAlternatives $find): JsonResponse
    {
        $alternatives = $find->handle($request->criteria());

        return response()->json(['data' => [
            /**
             * Up to three dates within 7 days either side, closest first.
             *
             * @var list<array{date: string, count: int}>
             */
            'nearbyDates' => $alternatives->nearbyDates,
            /**
             * The smallest wider radius with someone free on the date, or null.
             *
             * @var array{km: int, count: int}|null
             */
            'widerRadius' => $alternatives->widerRadius,
            /**
             * Whether style or price filters narrowed the search ("Show all styles").
             *
             * @var bool
             */
            'filtersApplied' => $alternatives->filtersApplied,
        ]]);
    }
}
