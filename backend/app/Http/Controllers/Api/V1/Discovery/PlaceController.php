<?php

namespace App\Http\Controllers\Api\V1\Discovery;

use App\Contracts\Geocoder;
use App\Http\Controllers\Controller;
use App\Http\Requests\Discovery\LookUpPlaceRequest;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class PlaceController extends Controller
{
    /**
     * The centre point of a typed town or a quick-pick city, for the Discover location field.
     */
    public function __invoke(LookUpPlaceRequest $request, Geocoder $geocoder): JsonResponse
    {
        $place = $geocoder->geocode($request->validated('q'));
        if ($place === null) {
            throw new NotFoundHttpException('No place matches that name.');
        }

        return response()->json(['data' => [
            /** What the location field shows, e.g. "Burlington, ON". */
            'label' => $place->normalisedAddress,
            'city' => $place->city,
            'lat' => $place->point->latitude,
            'lng' => $place->point->longitude,
        ]]);
    }
}
