<?php

namespace App\Policies;

use App\Enums\Role;
use App\Models\User;
use App\Models\VulnerableSectorCheck;
use Illuminate\Auth\Access\Response;

/** Who may reach a check's document: its owner and administrators; everyone else learns nothing (L2-049.4, L2-074.2). */
class VulnerableSectorCheckPolicy
{
    public function view(User $user, VulnerableSectorCheck $check): Response
    {
        return $check->user_id === $user->id || in_array(Role::Administrator, $user->roleNames(), true)
            ? Response::allow()
            : Response::denyAsNotFound();
    }
}
