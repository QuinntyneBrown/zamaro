<?php

use App\Models\User;
use Tests\Feature\Security\CrossUserAccessTest;

/** A church the owner saves before the intruder tries the church routes. */
$ownerChurch = [
    'name' => 'Owner Community Church', 'streetAddress' => '2150 Lakeshore Road', 'city' => 'Burlington',
    'postalCode' => 'L7R 1A3', 'phone' => '905-555-0111',
];

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

    'PUT api/v1/account/profile' => function (CrossUserAccessTest $test, User $owner, User $intruder): void {
        $test->as($intruder)->putJson('/api/v1/account/profile', ['name' => 'Intruder Name'])->assertOk();

        $test->as($owner)->getJson('/api/v1/me')->assertJsonPath('data.name', $owner->name);
    },

    'GET api/v1/account/church' => function (CrossUserAccessTest $test, User $owner, User $intruder) use ($ownerChurch): void {
        $test->as($owner)->putJson('/api/v1/account/church', $ownerChurch)->assertOk();

        $response = $test->as($intruder)->getJson('/api/v1/account/church')->assertOk()->assertExactJson(['data' => null]);

        $test->assertStringNotContainsString('Owner Community Church', $response->getContent());
    },

    'PUT api/v1/account/church' => function (CrossUserAccessTest $test, User $owner, User $intruder) use ($ownerChurch): void {
        $test->as($owner)->putJson('/api/v1/account/church', $ownerChurch)->assertOk();

        $test->as($intruder)->putJson('/api/v1/account/church', [...$ownerChurch, 'name' => 'Intruder Chapel', 'phone' => '905-555-0999'])->assertOk();

        $test->as($owner)->getJson('/api/v1/account/church')
            ->assertJsonPath('data.name', 'Owner Community Church')
            ->assertJsonPath('data.phone', '905-555-0111');
    },

    'GET api/v1/account/contact-phone' => function (CrossUserAccessTest $test, User $owner, User $intruder): void {
        $test->makeArtist($owner)->update(['contact_phone' => '+19055550111']);
        $test->makeArtist($intruder);

        $response = $test->as($intruder)->getJson('/api/v1/account/contact-phone')->assertOk()->assertJsonPath('data.contactPhone', null);

        $test->assertStringNotContainsString('0111', $response->getContent());
    },

    'PUT api/v1/account/contact-phone' => function (CrossUserAccessTest $test, User $owner, User $intruder): void {
        $test->makeArtist($owner)->update(['contact_phone' => '+19055550111']);
        $test->makeArtist($intruder);

        $test->as($intruder)->putJson('/api/v1/account/contact-phone', ['contactPhone' => '905-555-0999'])->assertOk();

        $test->as($owner)->getJson('/api/v1/account/contact-phone')->assertJsonPath('data.contactPhone', '905-555-0111');
    },
];
