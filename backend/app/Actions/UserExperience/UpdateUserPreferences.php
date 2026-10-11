<?php

namespace App\Actions\UserExperience;

use App\Enums\ThemePreference;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/** Saves the theme a signed-in person chose (L2-104.2), so their other devices follow it. */
class UpdateUserPreferences
{
    public function handle(User $user, ?ThemePreference $theme): User
    {
        return DB::transaction(function () use ($user, $theme) {
            $user->forceFill(['theme_preference' => $theme])->save();

            return $user;
        });
    }
}
