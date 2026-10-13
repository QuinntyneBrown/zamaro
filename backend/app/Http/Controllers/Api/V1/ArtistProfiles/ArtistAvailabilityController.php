<?php

namespace App\Http\Controllers\Api\V1\ArtistProfiles;

use App\Actions\ArtistProfiles\ArtistMoved;
use App\Actions\ArtistProfiles\ArtistNotFound;
use App\Actions\ArtistProfiles\ListTourDates;
use App\Actions\ArtistProfiles\ResolveArtistSlug;
use App\Http\Controllers\Controller;
use App\Http\Requests\ArtistProfiles\CheckDateRequest;
use App\Http\Requests\ArtistProfiles\ListTourDatesRequest;
use App\Http\Resources\ArtistProfiles\TourDateResource;
use App\Services\ArtistAvailability\AvailabilityService;
use App\Services\Bookings\CancellationPolicy;
use Illuminate\Http\JsonResponse;

class ArtistAvailabilityController extends Controller
{
    /**
     * Whether the artist is free on one date, for the booking stub (L2-019).
     *
     * @throws ArtistMoved when the address is the artist's retired slug
     * @throws ArtistNotFound when no visible artist has the address
     */
    public function check(CheckDateRequest $request, AvailabilityService $availability, CancellationPolicy $policy, ResolveArtistSlug $slugs, string $slug): JsonResponse
    {
        $artist = $slugs->handle($slug);
        $date = $request->eventDate();
        $free = $availability->isFree($artist, $date);

        return response()->json(['data' => [
            /** `YYYY-MM-DD`, as asked. */
            'date' => $date->toDateString(),
            'free' => $free,
            /** On a free date, the last day a booking on it could be cancelled for free (L2-044); otherwise null. */
            'freeCancellationUntil' => $free ? $policy->freeCancellationUntil($date)->toDateString() : null,
        ]])->setPublic()->setMaxAge(0)->setSharedMaxAge(60);
    }

    /**
     * The artist's next 6 free or booked dates, for the "On tour" list (L2-017).
     *
     * @throws ArtistMoved when the address is the artist's retired slug
     * @throws ArtistNotFound when no visible artist has the address
     */
    public function tourDates(ListTourDatesRequest $request, ListTourDates $tourDates, string $slug): JsonResponse
    {
        return TourDateResource::collection($tourDates->handle($slug, $request->from()))
            ->response($request)
            ->setPublic()
            ->setMaxAge(0)
            ->setSharedMaxAge(60);
    }
}
