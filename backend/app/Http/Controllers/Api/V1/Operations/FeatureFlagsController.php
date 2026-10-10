<?php

namespace App\Http\Controllers\Api\V1\Operations;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class FeatureFlagsController extends Controller
{
    /**
     * Which unfinished features this environment has turned on (ADR-0012). Every flag is off unless
     * the environment's configuration turns it on.
     */
    public function __invoke(): JsonResponse
    {
        return response()->json(['data' => [
            /** Sending booking requests from the profile's booking stub (bookings/send-booking-request). */
            'bookingRequests' => (bool) config('zamaro.features.booking_requests'),
        ]])->setPublic()->setMaxAge(0)->setSharedMaxAge(60);
    }
}
