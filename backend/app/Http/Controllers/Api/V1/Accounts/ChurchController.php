<?php

namespace App\Http\Controllers\Api\V1\Accounts;

use App\Actions\Accounts\SaveChurch;
use App\Http\Controllers\Controller;
use App\Http\Requests\Accounts\SaveChurchRequest;
use App\Http\Resources\Accounts\ChurchResource;
use App\Models\Church;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** A booker's church (accounts/manage-church-profile); bookers only. */
class ChurchController extends Controller
{
    /**
     * The signed-in booker's church.
     *
     * `data` is null until they save one.
     */
    public function show(Request $request): JsonResponse
    {
        $church = Church::where('booker_id', $request->user()->id)->first();

        return response()->json([
            /** @var ChurchResource|null */
            'data' => $church === null ? null : new ChurchResource($church),
        ]);
    }

    /**
     * Save the church.
     *
     * Creates or replaces the booker's one church. The address is looked up and must be within 200 km
     * of Toronto by road (L2-001); otherwise nothing is stored. Bookings already sent keep the address
     * they were made with (L2-024.3).
     */
    public function update(SaveChurchRequest $request, SaveChurch $save): ChurchResource
    {
        $church = $save->handle($request->user(), $request->validated());
        // Saving replaces the one church: 200 whether or not it existed, never 201.
        $church->wasRecentlyCreated = false;

        return new ChurchResource($church);
    }
}
