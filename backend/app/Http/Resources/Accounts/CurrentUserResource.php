<?php

namespace App\Http\Resources\Accounts;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * The signed-in person as the app needs them: the header's initials and name, the roles that decide
 * which areas open, and the flags that route them (current-user names, ADR-0016). Only ever
 * returned to that person.
 *
 * @property User $resource
 */
class CurrentUserResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $user = $this->resource;

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            /** Two letters for the avatar: "NF". */
            'initials' => $user->initials(),
            /** @var list<'booker'|'artist'|'admin'> */
            'roles' => array_map(fn (Role $role) => $role->value, $user->roleNames()),
            'emailVerified' => $user->email_verified_at !== null,
            /** A new address asked for and not yet confirmed from its link (L2-025.1), or null. */
            'pendingEmail' => $user->pending_email,
            /**
             * A booker's church, for the header's menu, the footer and Discover's starting point
             * (L2-024.2, L2-004.1); null for an artist or a booker without one.
             */
            'church' => $user->church === null ? null : [
                'name' => $user->church->name,
                'city' => $user->church->city,
                'latitude' => $user->church->latitude,
                'longitude' => $user->church->longitude,
            ],
            /**
             * The theme chosen on any signed-in device, or null to follow the device. Always null
             * until the account can store one (M2 S18).
             *
             * @var 'light'|'dark'|null
             */
            'themePreference' => null,
            /** True when the current terms must be accepted first. Always false until terms versions exist (M2 S14). */
            'termsAcceptanceRequired' => false,
        ];
    }
}
