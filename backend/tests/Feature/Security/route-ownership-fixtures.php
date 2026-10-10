<?php

use App\Models\User;
use Tests\Feature\Security\CrossUserAccessTest;

/*
 * One case per authenticated route (`METHOD uri`), proving that the intruder, another signed-in user,
 * gets nothing of the owner's (L2-074.2, L2-074.3). CrossUserAccessTest fails for a route with no case,
 * so every new authenticated route ships with its case in the same commit.
 *
 * A route that names a resource asks for the owner's identifier as the intruder and expects the
 * concealing 404. A route with no identifier acts on the caller alone: the intruder's answer holds none
 * of the owner's values, and the owner is unaffected.
 */
return [
    'GET api/v1/me' => function (CrossUserAccessTest $test, User $owner, User $intruder): void {
        $response = $test->as($intruder)->getJson('/api/v1/me')->assertOk();

        $test->assertHoldsNothingOf($owner, $response);
    },

    'DELETE api/v1/session' => function (CrossUserAccessTest $test, User $owner, User $intruder): void {
        $test->as($intruder)->deleteJson('/api/v1/session')->assertNoContent();

        $test->as($owner)->getJson('/api/v1/me')->assertOk()->assertJsonPath('data.email', $owner->email);
    },
];
