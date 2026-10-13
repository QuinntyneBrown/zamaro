<?php

namespace App\Http\Controllers\Api\V1\Accounts;

use App\Http\Controllers\Controller;
use App\Http\Requests\Accounts\UpdateContactPhoneRequest;
use App\Models\Artist;
use App\Rules\NorthAmericanPhone;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * An artist's private contact phone (L2-025.4): never on the public profile, and shown only to the
 * booker of a Confirmed booking (M5). Artists only; anyone else gets 404 (L2-074.1).
 */
class ArtistContactController extends Controller
{
    /**
     * The signed-in artist's contact phone.
     *
     * `contactPhone` is null until they save one.
     */
    public function show(Request $request): JsonResponse
    {
        return $this->answer(Artist::where('user_id', $request->user()->id)->firstOrFail());
    }

    /**
     * Save the contact phone.
     *
     * Stored encrypted, in E.164 (L2-079.2).
     */
    public function update(UpdateContactPhoneRequest $request): JsonResponse
    {
        $artist = Artist::where('user_id', $request->user()->id)->firstOrFail();
        $artist->update(['contact_phone' => NorthAmericanPhone::toE164($request->validated('contactPhone'))]);

        return $this->answer($artist);
    }

    private function answer(Artist $artist): JsonResponse
    {
        return response()->json([
            'data' => [
                /** "905-555-0148", or null until the artist saves one. */
                'contactPhone' => $artist->contact_phone === null ? null : NorthAmericanPhone::format($artist->contact_phone),
            ],
        ]);
    }
}
