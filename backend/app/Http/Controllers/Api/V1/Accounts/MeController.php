<?php

namespace App\Http\Controllers\Api\V1\Accounts;

use App\Actions\UserExperience\UpdateUserPreferences;
use App\Enums\ThemePreference;
use App\Http\Controllers\Controller;
use App\Http\Requests\UserExperience\UpdatePreferencesRequest;
use App\Http\Resources\Accounts\CurrentUserResource;
use Illuminate\Http\Request;

class MeController extends Controller
{
    /**
     * The signed-in person.
     *
     * A guest gets 401.
     */
    public function show(Request $request): CurrentUserResource
    {
        return new CurrentUserResource($request->user()->load('roles'));
    }

    /**
     * Save preferences.
     *
     * The theme chosen with the toggle, so every device the person signs in on follows it (L2-104.2).
     * Answers the signed-in person.
     */
    public function updatePreferences(UpdatePreferencesRequest $request, UpdateUserPreferences $update): CurrentUserResource
    {
        $theme = $request->validated('themePreference');

        return new CurrentUserResource($update->handle(
            $request->user(),
            $theme === null ? null : ThemePreference::from($theme),
        )->load('roles'));
    }
}
